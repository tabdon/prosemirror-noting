import { ValidationLibrary } from "../../interfaces/Validation";

export const validationLibrary: ValidationLibrary = [
  [
    {
      regExp: new RegExp("first match", "g"),
      annotation: "Found 'first match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ],
  [
    {
      regExp: new RegExp("second match", "g"),
      annotation: "Found 'second match'",
      operation: "ANNOTATE",
      type: "legal"
    },
    {
      regExp: new RegExp("match", "g"),
      annotation: "Found 'match'",
      operation: "ANNOTATE",
      type: "legal"
    }
  ]
];