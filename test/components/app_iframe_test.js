"use strict";

require("../test_helper");
var React = require("react/addons");
var TestUtils = React.addons.TestUtils;
var MessageStore = require("../../scripts/stores/message_store");
var KeyValueStore = require("../../scripts/stores/key_value_store");
var AppIframe = require("../../scripts/components/app_iframe");
var MessageActions = require("../../scripts/actions/message_actions");
var FlashActions = require("../../scripts/actions/flash_actions");
var MenuActions = require("../../scripts/actions/menu_actions");
var DialogActions = require("../../scripts/actions/dialog_actions");
var AppActions = require("../../scripts/actions/app_actions");
var Immutable = require("immutable");

describe("AppIframe", () => {
  var appIframe, iframe, contentWindow;

  beforeEach(() => {
    MessageStore.reset();
  });

  describe("postMessage", () => {

    beforeEach(() => {
      appIframe = TestUtils.renderIntoDocument(<AppIframe src="http://foo.com/bar.html" usePost={false} postData={Immutable.Map()} />);
      iframe = TestUtils.findRenderedDOMComponentWithTag(appIframe, "iframe");
      contentWindow = iframe.getDOMNode().contentWindow;

      if(contentWindow.hasOwnProperty("postMessage")) {
        sinon.spy(contentWindow, "postMessage");
      } else {
        contentWindow.postMessage = sinon.stub();
      }
    });

    afterEach(() => {
      React.unmountComponentAtNode(appIframe.getDOMNode().parentNode);
    });

    describe("when a store event is received", () => {
      beforeEach(() => {
        KeyValueStore.emitChange({
          type: "get",
          data: {
            key: "users.user_id",
            value: 53
          }
        });
      });

      it("sends a store postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "store",
          payload: {
            type: "get",
            data: {
              key: "users.user_id",
              value: 53
            }
          }
        });
      });
    });

    describe("when a message is received with a JSON value", () => {
      beforeEach(() => {
        MessageActions.receiveGeneratedMessage(Immutable.Map({
          namespace: "another-app",
          key: "some-data",
          value: "{\"foo\": [1, 2, \"bar\"]}"
        }));
      });

      it("sends a trigger postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "trigger",
          payload: {
            type: "another-app.some-data",
            data: { foo: [1, 2, "bar"] }
          }
        });
      });
    });

    describe("when a message is received with a non-JSON value", () => {
      beforeEach(() => {
        MessageActions.receiveGeneratedMessage(Immutable.Map({
          namespace: "another-app",
          key: "selected",
          value: 3
        }));
      });

      it("sends a trigger postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "trigger",
          payload: {
            type: "another-app.selected",
            data: 3
          }
        });
      });
    });

    describe("when a flash message event is received", () => {
      beforeEach(() => {
        FlashActions.flashInteraction({type: "confirm"});
      });

      it("sends a trigger postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "flash",
          payload: {
            type: "confirm"
          }
        });
      });
    });

    describe("when a menu message event is received", () => {
      beforeEach(() => {
        MenuActions.menuInteraction("help");
      });

      it("sends a menu postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "menu",
          payload: {
            type: "help"
          }
        });
      });
    });

    describe("when a dialog message event is received", () => {
      beforeEach(() => {
        DialogActions.dialogInteraction({title: "no"});
      });

      it("sends a dialog postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "dialog",
          payload: {
            type: "action",
            data: "no"
          }
        });
      });
    });

    describe("when an authenticate response, post message is received", () => {
      beforeEach(() => {
        AppActions.receivePostMessage({
          type: "authenticate",
          payload: {
            type: "response",
            data: "dummy code"
          }
        })
      });

      it("sends an authenticate postMessage", () => {
        expect(contentWindow.postMessage).to.have.been.calledWith({
          type: "authenticate",
          payload: {
            type: "respond",
            data: "dummy code"
          }
        });
      });
    });
  });

  describe("When use_post is true", () => {
    it("renders a form and an iframe", () => {
      var postData = Immutable.fromJS({payload: {}, secret_key: "key"});
      appIframe = TestUtils.renderIntoDocument(<AppIframe src="http://foo.com/bar.html" usePost={true} postData={postData} />);
      iframe = TestUtils.findRenderedDOMComponentWithTag(appIframe, "iframe");
      var form = TestUtils.findRenderedDOMComponentWithTag(appIframe, "form");
      expect(iframe.getDOMNode()).to.not.eql(null);
      expect(form.getDOMNode()).to.not.eql(null);
    });
  });

  describe("When use_post is false", () => {
    it("doesn't render a form", () => {
      var postData = Immutable.fromJS({payload: {}, secret_key: "key"});
      appIframe = TestUtils.renderIntoDocument(<AppIframe src="http://foo.com/bar.html" usePost={false} postData={postData} />);
      iframe = TestUtils.findRenderedDOMComponentWithTag(appIframe, "iframe");
      var forms = TestUtils.scryRenderedDOMComponentsWithTag(appIframe, "form");
      expect(iframe.getDOMNode()).to.not.eql(null);
      expect(forms.length).to.eql(0);
    });
  });
});
