export default function preprocessHTMLAsFragment(content: string) {
  const fragment = document.createRange().createContextualFragment(content);
  for (const anchor of fragment.querySelectorAll("a")) {
    anchor.classList.add("coloraccentbold", "nodecoration", "underlineonhover");
  }
  return fragment;
}
