export default function Footer() {
  return (
    <footer className="w-full border-t border-black/5">
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-2">
        <p
          className="text-[10px] md:text-xs leading-tight text-[#777] select-none"
          aria-label="Informations légales OneBoarding AI"
        >
          <span className="whitespace-nowrap">
            OneBoarding AI® — Marque déposée fondée et représentée par Benmehdi Mohamed Rida.
          </span>{" "}
          <span className="whitespace-nowrap">
            © 2025 OneBoardingAI.com — Tous droits réservés.
          </span>
        </p>
      </div>
    </footer>
  );
}
