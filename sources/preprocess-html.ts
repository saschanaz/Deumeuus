export default function preprocessHTMLAsFragment(content: string) {
  const fragment = document.createRange().createContextualFragment(content);
  for (const anchor of fragment.querySelectorAll("a")) {
    anchor.classList.add("coloraccentbold", "nodecoration", "underlineonhover");
  }
  for (const mention of fragment.querySelectorAll<HTMLAnchorElement>("a.mention")) {
    mention.addEventListener("click", ev => {
      ev.preventDefault();
      const address = `${mention.textContent}@${new URL(mention.href).host}`;
      mention.dispatchEvent(new CustomEvent("deu-mentionclick-internal", {
        bubbles: true,
        detail: {
          href: mention.href,
          address
        }
      }));
    });
  }
  return fragment;
}
