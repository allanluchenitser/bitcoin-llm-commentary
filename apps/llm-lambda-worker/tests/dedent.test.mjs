import { dedent } from "../dist/llm_help.js";

// This is an important test given this function sends prompts to LLM apis

describe("dedent", () => {
  test("removes shared indentation and keeps relative indentation", () => {
    const input = `
      line one
      line two
        line three
    `;

    expect(dedent(input)).toBe("line one\nline two\n  line three");
  });

  test("ignores empty lines when calculating minimum indentation", () => {
    const input = `
        alpha

        beta

    `;

    expect(dedent(input)).toBe("alpha\n\nbeta");
  });

  test("returns left-aligned text unchanged", () => {
    const input = "alpha\nbeta";

    expect(dedent(input)).toBe("alpha\nbeta");
  });

  test("trims only trailing whitespace/newlines at the end", () => {
    const input = `
      alpha
      beta

    `;

    expect(dedent(input)).toBe("alpha\nbeta");
  });

  test("handles tabs and spaces in indentation", () => {
    const input = "\n\t\tstart\n\t\t  nested\n\t\tend\n";

    expect(dedent(input)).toBe("start\n  nested\nend");
  });

  test("handles a string with only whitespace", () => {
    expect(dedent("\n    \n\t\n")).toBe("");
  });
});
