"use strict";

require("../test_helper");
var React = require("react/addons");
var TestUtils = React.addons.TestUtils;
var ValidationForm = require("../../scripts/components/validation_form");
var Validator = require("../../scripts/lib/validator");
var Input = require("../../scripts/components/lib/input_horizontal");
var Immutable = require("immutable");

describe("ValidationForm", () => {
  var instance, data, validations, errors, onErrorCallback, onSubmitFormCallback;

  beforeEach(() => {
    data = Immutable.fromJS({
      firstname: ""
    });

    validations = {
      firstname: [Validator.required]
    };

    onErrorCallback = sinon.spy((e) => {
      errors = e;
    });

    onSubmitFormCallback = sinon.stub();
  });

  afterEach(() => {
    React.unmountComponentAtNode(instance.getDOMNode().parentNode);
  });

  it("renders the children", () => {
    instance = TestUtils.renderIntoDocument(
      <ValidationForm fields={data}
        validations={validations}
        onError={onErrorCallback}
        onSubmit={onSubmitFormCallback}>

        <h2>Heading</h2>
      </ValidationForm>
    );

    var heading = TestUtils.findRenderedDOMComponentWithTag(instance, "h2");
    expect(heading.getDOMNode().textContent).to.eql("Heading");
  });

  describe("validation", () => {

    describe("when validation errors exist", () => {
      var submitBtn;

      beforeEach(() => {
        instance = TestUtils.renderIntoDocument(
          <ValidationForm fields={data}
            validations={validations}
            onError={onErrorCallback}
            onSubmit={onSubmitFormCallback}>

            <Input name="firstname" label="firstname" />
            <button type="submit">Submit</button>
          </ValidationForm>
        );
        submitBtn = TestUtils.findRenderedDOMComponentWithTag(instance, "button");
      });

      describe("when the form is submitted", () => {
        it("doesn't call props.onSubmit", () => {
          TestUtils.Simulate.submit(submitBtn);
          expect(onSubmitFormCallback).to.not.have.been.called;
        });

        it("calls prop.onError with errors", () => {
          var submitBtn = TestUtils.findRenderedDOMComponentWithTag(instance, "button");
          var expected = Immutable.Map({
            firstname: Immutable.List([ "Can't be blank" ])
          });
          TestUtils.Simulate.submit(submitBtn);
          expect(onErrorCallback).to.have.been.called;
          expect(Immutable.is(errors, expected)).to.eql(true);
        });
      });
    });

    describe("when no validation errors exist", () => {
      var submitBtn;

      beforeEach(() => {
        var data = Immutable.fromJS({
          firstname: "MyFirstName"
        });

        instance = TestUtils.renderIntoDocument(
          <ValidationForm fields={data}
            validations={validations}
            onError={onErrorCallback}
            onSubmit={onSubmitFormCallback}>

            <Input name="firstname" label="firstname" />
            <button type="submit">Submit</button>
          </ValidationForm>
        );

        submitBtn = TestUtils.findRenderedDOMComponentWithTag(instance, "button");
      });

      describe("when the form is submitted", () => {
        it("calls props.onSubmit", () => {
          TestUtils.Simulate.submit(submitBtn);
          expect(onSubmitFormCallback).to.have.been.called;
        });

        it("doesn't call props.onError", () => {
          var submitBtn = TestUtils.findRenderedDOMComponentWithTag(instance, "button");
          TestUtils.Simulate.submit(submitBtn);
          expect(onErrorCallback).to.not.have.been.called;
        });
      });
    });
  });
});

