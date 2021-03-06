"use strict";

require("../test_helper");
var React = require("react/addons");
var TestUtils = React.addons.TestUtils;
var KeyValueStore = require("../../scripts/stores/key_value_store");
var StorePanel = require("../../scripts/components/store_panel");
var AppActions = require("../../scripts/actions/app_actions");

describe("StorePanel", () => {
  var storePanel, inputs, form;

  beforeEach(() => {
    KeyValueStore.reset();
    KeyValueStore.setValue("our-customers.selected_customer", {
        id: 15,
        name: "Some Customer"
    });
    KeyValueStore.setValue("very-different-app.bool_value", true);
    KeyValueStore.setValue("some-other-app.simple_value", 22);
    sinon.spy(AppActions, "receiveStoreConfiguration");
    storePanel = TestUtils.renderIntoDocument(React.createElement(StorePanel));
    inputs = TestUtils.scryRenderedDOMComponentsWithTag(storePanel, "input");
    form = TestUtils.findRenderedDOMComponentWithTag(storePanel, "form");
  });

  afterEach(() => {
    AppActions.receiveStoreConfiguration.restore();
    React.unmountComponentAtNode(storePanel.getDOMNode().parentNode);
  });

  describe("when the form is changed with empty data", () => {
    beforeEach(() => {
      TestUtils.Simulate.change(inputs[0].getDOMNode(), {
        target: {
          name: "key",
          value: ""
        }
      });

      TestUtils.Simulate.change(inputs[1].getDOMNode(), {
        target: {
          name: "value",
          value: "27"
        }
      });
    });

    it("highlights the errors to the fields", () => {
      expect(storePanel.getDOMNode().textContent).to.not.include("Can't be blank");
      TestUtils.Simulate.submit(form.getDOMNode());
      expect(storePanel.getDOMNode().textContent).to.include("Can't be blank");
    });
  });

  describe("when the form is changed with invalid data", () => {
    beforeEach(() => {
      TestUtils.Simulate.change(inputs[0].getDOMNode(), {
        target: {
          name: "key",
          value: "invalid namespace.invalid_key"
        }
      });

      TestUtils.Simulate.change(inputs[1].getDOMNode(), {
        target: {
          name: "value",
          value: "27"
        }
      });
    });

    it("highlights the errors to the fields", () => {
      expect(storePanel.getDOMNode().textContent).to.not.include("Must contain a namespace and key");
      TestUtils.Simulate.submit(form.getDOMNode());
      expect(storePanel.getDOMNode().textContent).to.include("Must contain a namespace and key");
    });
  });

  describe("when the form is changed with valid data", () => {
    beforeEach(() => {
      TestUtils.Simulate.change(inputs[0].getDOMNode(), {
        target: {
          name: "key",
          value: "valid-namespace.key_to_set"
        }
      });

      TestUtils.Simulate.change(inputs[1].getDOMNode(), {
        target: {
          name: "value",
          value: "27"
        }
      });
    });

    it("doesn't show any errors", function() {
      TestUtils.Simulate.submit(form.getDOMNode());
      expect(storePanel.getDOMNode().textContent).to.not.include("Can't be blank");
      expect(storePanel.getDOMNode().textContent).to.not.include("Must contain a namespace and key");
    });

    it("shows the new value in the input box", () => {
      expect(inputs[0].getDOMNode().value).to.eql("valid-namespace.key_to_set");
      expect(inputs[1].getDOMNode().value).to.eql("27");
    });

    it("triggers a storeConfiguration event on submit", () => {
      TestUtils.Simulate.submit(form.getDOMNode());
      expect(AppActions.receiveStoreConfiguration).to.have.been.called;
    });
  });

  describe("clicking on the store table", () => {
    var rows;
    beforeEach(() => {
      rows = TestUtils.scryRenderedDOMComponentsWithTag(storePanel, "tr");
    });

    it("populates the form from the row", function() {
      expect(inputs[0].getDOMNode().value).to.eql("");
      expect(inputs[1].getDOMNode().value).to.eql("");
      TestUtils.Simulate.click(rows[0].getDOMNode());
      expect(inputs[0].getDOMNode().value).to.eql("our-customers.selected_customer");
      expect(inputs[1].getDOMNode().value).to.eql("{\"id\":15,\"name\":\"Some Customer\"}");
      TestUtils.Simulate.click(rows[1].getDOMNode());
      expect(inputs[0].getDOMNode().value).to.eql("some-other-app.simple_value");
      expect(inputs[1].getDOMNode().value).to.eql("22");
    });
  });

  describe("Store Table rows", () => {
    var rows;
    beforeEach(() => {
      rows = TestUtils.scryRenderedDOMComponentsWithTag(storePanel, "tr");
    });

    it("shows JSON in the table rows", function() {
      expect(rows[0].getDOMNode().textContent).to.include("our-customers.selected_customer");
      expect(rows[0].getDOMNode().textContent).to.include("{\"id\":15,\"name\":\"Some Customer\"}");
    });

    it("shows integers in the table rows", function() {
      expect(rows[1].getDOMNode().textContent).to.include("22");
    });

    it("shows booleans in the table rows", function() {
      expect(rows[2].getDOMNode().textContent).to.include("true");
    });

    describe("clicking on delete in the store table", () => {
      it("deletes the row", function() {
        expect(rows.length).to.eql(3);
        TestUtils.Simulate.click(rows[1].getDOMNode().querySelector("td:last-child"));
        rows = TestUtils.scryRenderedDOMComponentsWithTag(storePanel, "tr");
        expect(rows.length).to.eql(2);
        TestUtils.Simulate.click(rows[0].getDOMNode().querySelector("td:last-child"));
        rows = TestUtils.scryRenderedDOMComponentsWithTag(storePanel, "tr");
        expect(rows.length).to.eql(1);
      });
    });
  });

});
