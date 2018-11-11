import { builders } from "prosemirror-test-builder";
import { nodes, marks } from "prosemirror-schema-basic";
import { Transaction } from "prosemirror-state";
import { Schema } from "prosemirror-model";
import {
  validationPluginReducer,
  validationRequestError,
  validationRequestPending,
  validationRequestStart,
  validationRequestSuccess,
  newHoverIdReceived
} from "../state";
import { DecorationSet, Decoration } from "prosemirror-view";
import {
  createDebugDecorationFromRange,
  DECORATION_INFLIGHT
} from "../utils/decoration";

const noteSchema = new Schema({
  nodes,
  marks
});

const build = builders(noteSchema, {
  p: {
    markType: "paragraph"
  }
});

const { doc, p } = build;

const initialDocToValidate = doc(p("Example text to validate"));
const initialTr = new Transaction(initialDocToValidate);
initialTr.doc = initialDocToValidate;
initialTr.time = 0;
const initialState = {
	currentThrottle: 100,
	initialThrottle: 100,
	maxThrottle: 1000,
	decorations: DecorationSet.create(doc, []),
	dirtiedRanges: [],
	lastValidationTime: 0,
	hoverId: undefined,
	trHistory: [initialTr],
	validationInFlight: undefined,
	validationPending: false,
	error: undefined
  };

describe("State management", () => {
  describe("validationRequestPending", () => {
    it("should mark the state as pending validation", () => {
      expect(
        validationPluginReducer(
          initialTr,
          initialState,
          validationRequestPending()
        )
      ).toEqual({
        ...initialState,
        validationPending: true
      });
    });
  });
  describe("validationRequestStart", () => {
    it("should remove the pending status and any dirtied ranges, and mark the validation as in flight", () => {
      const docToValidate = doc(p("Example text to validate"));
      const tr = new Transaction(docToValidate);
      tr.doc = docToValidate;
      tr.time = 1337;
      expect(
        validationPluginReducer(
          tr,
          {
            ...initialState,
            dirtiedRanges: [{ from: 5, to: 10 }],
            validationPending: true
          },
          validationRequestStart()
        )
      ).toEqual({
        ...initialState,
        dirtiedRanges: [],
        decorations: new DecorationSet().add(docToValidate, [
          createDebugDecorationFromRange({ from: 1, to: 25 }, false)
        ]),
        validationPending: false,
        validationInFlight: {
          validationInputs: [
            {
              str: "Example text to validate",
              from: 1,
              to: 25
            }
          ],
          id: 1337
        }
      });
    });
    it("should remove debug decorations, if any", () => {
      const docToValidate = doc(p("Example text to validate"));
      const tr = new Transaction(docToValidate);
      tr.doc = docToValidate;
      tr.time = 1337;
      expect(
        validationPluginReducer(
          tr,
          {
            ...initialState,
            dirtiedRanges: [{ from: 5, to: 10 }],
            decorations: new DecorationSet().add(docToValidate, [
              createDebugDecorationFromRange({ from: 1, to: 3 })
            ]),
            validationPending: true
          },
          validationRequestStart()
        )
      ).toEqual({
        ...initialState,
        dirtiedRanges: [],
        decorations: new DecorationSet().add(docToValidate, [
          createDebugDecorationFromRange({ from: 1, to: 25 }, false)
        ]),
        validationPending: false,
        validationInFlight: {
          validationInputs: [
            {
              str: "Example text to validate",
              from: 1,
              to: 25
            }
          ],
          id: 1337
        }
      });
    });
  });
  describe("validationRequestSuccess", () => {
    it("shouldn't do anything if there's nothing in the response", () => {
      expect(
        validationPluginReducer(
          initialTr,
          initialState,
          validationRequestSuccess({
            validationOutputs: [],
            id: "1337"
          })
        )
      ).toEqual(initialState);
    });
    it("should create decorations for the incoming validations", () => {
      const docToValidate = doc(p("Example text to validate"));
	  const tr = new Transaction(docToValidate);
	  tr.doc = docToValidate;
      tr.time = 1337;
      expect(
        validationPluginReducer(
          tr,
          initialState,
          validationRequestSuccess({
            validationOutputs: [{
				str: "Example text to validate",
				from: 5,
				to: 10,
				annotation: "Summat ain't right",
				type: "EXAMPLE_TYPE"
			}],
            id: "1337"
          })
        )
      ).toEqual(initialState);
    });
  });
  describe("validationRequestError", () => {});
  describe("newHoverIdReceived", () => {
    it("should update the hover id", () => {
      expect(
        validationPluginReducer(
          new Transaction(doc),
          initialState,
          newHoverIdReceived("exampleHoverId")
        )
      ).toEqual({
        ...initialState,
        hoverId: "exampleHoverId"
      });
    });
  });
});