// `formData.get()` yields `string | File | null`. Passing that through
// `String()` turns a missing field into the truthy literal "null" and a file
// into "[object File]", so emptiness guards on the result never fire.
export function readTextField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
