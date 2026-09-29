/** Current product naming only; never rewrite source citations or recorded provider artifacts. */
export function currentOrganizationText(text: string) {
  return text
    .replaceAll("Bob Builder Infrastructure", "BobsBuildings")
    .replaceAll("Bob Builder", "BobsBuildings");
}
