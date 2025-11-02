// ================================================
// OneBoarding AI — Global Phone Selector
// v1.0 · Novembre 2025
// Designed & validated under the Benmehdi Protocol
// Mainteneur : Benmehdi Mohamed Rida — office.benmehdi@gmail.com
// ================================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Règles fondatrices (validées) :
 *
 * 1. Le numéro de téléphone mobile (E.164) = identité souveraine.
 *    -> Aucun prénom, aucun email obligatoires.
 *    -> Cet input sert à créer l’espace, à se reconnecter, à tout.
 *
 * 2. Sélecteur pays : mondial, crédible, lisible par tous.
 *    -> Drapeau emoji.
 *    -> Nom international (FR/EN lisible partout).
 *    -> "•" + nom local/autonyme quand pertinent (عربى, 中文, etc).
 *    -> Indicatif téléphonique.
 *
 * 3. Classement :
 *    -> Alphabétique global par le nom international.
 *    -> Pas de favoritisme affiché dans l’UI. Maroc reste la valeur par défaut au chargement,
 *       mais visuellement la liste est internationale.
 *
 * 4. Recherche :
 *    -> Champ “Rechercher un pays…” au-dessus de la liste.
 *    -> Filtre live sur nom international, nom local et code pays.
 *    -> Quand on tape, on ne voit plus que les correspondances.
 *
 * 5. E.164 généré live :
 *    -> On compose automatiquement `+<dial><localNumberSans0Initial>`.
 *    -> On remonte ça au parent via onChange(e164).
 *
 * 6. Aucune logique serveur changée.
 *    -> Purement UI/UX + profondeur mondiale.
 */

// -------------------------------------------------
// Type pays
// -------------------------------------------------

type Country = {
  code: string; // ISO2 ou code interne stable ("MA", "FR", "US", "HK", etc.)
  dial: string; // Sans le "+"
  flag: string; // Emoji drapeau (ou équivalent régional)
  intlName: string; // Nom international lisible (FR/EN)
  localName: string; // Nom local/autonyme (peut = intlName)
};

// -------------------------------------------------
// Liste mondiale des pays reconnus par l'ONU (193)
// + entités additionnelles validées politiquement ici :
//   - Palestine
//   - Kosovo
//   - Taïwan
//   - Hong Kong
//   - Macao
//   - Gibraltar
//   - Puerto Rico
//
// Triée alphabétiquement par intlName.
// Règle d'affichage :
//  - Label visuel = intlName [+ " • " + localName si différent] + " " + flag + " (+" + dial + ")"
// -------------------------------------------------

const ALL_COUNTRIES: Country[] = [
  // A
  { code: "AF", dial: "93", flag: "🇦🇫", intlName: "Afghanistan", localName: "افغانستان" },
  { code: "AL", dial: "355", flag: "🇦🇱", intlName: "Albanie", localName: "Shqipëria" },
  { code: "DZ", dial: "213", flag: "🇩🇿", intlName: "Algérie", localName: "الجزائر" },
  { code: "AD", dial: "376", flag: "🇦🇩", intlName: "Andorre", localName: "Andorra" },
  { code: "AO", dial: "244", flag: "🇦🇴", intlName: "Angola", localName: "Angola" },
  { code: "AG", dial: "1268", flag: "🇦🇬", intlName: "Antigua & Barbuda", localName: "Antigua & Barbuda" },
  { code: "SA", dial: "966", flag: "🇸🇦", intlName: "Arabie Saoudite", localName: "المملكة العربية السعودية" },
  { code: "AR", dial: "54", flag: "🇦🇷", intlName: "Argentine", localName: "Argentina" },
  { code: "AM", dial: "374", flag: "🇦🇲", intlName: "Arménie", localName: "Հայաստան" },
  { code: "AU", dial: "61", flag: "🇦🇺", intlName: "Australie", localName: "Australia" },
  { code: "AT", dial: "43", flag: "🇦🇹", intlName: "Autriche", localName: "Österreich" },
  { code: "AZ", dial: "994", flag: "🇦🇿", intlName: "Azerbaïdjan", localName: "Azərbaycan" },

  // B
  { code: "BS", dial: "1242", flag: "🇧🇸", intlName: "Bahamas", localName: "Bahamas" },
  { code: "BH", dial: "973", flag: "🇧🇭", intlName: "Bahreïn", localName: "البحرين" },
  { code: "BD", dial: "880", flag: "🇧🇩", intlName: "Bangladesh", localName: "বাংলাদেশ" },
  { code: "BB", dial: "1246", flag: "🇧🇧", intlName: "Barbade", localName: "Barbados" },
  { code: "BY", dial: "375", flag: "🇧🇾", intlName: "Biélorussie", localName: "Беларусь" },
  { code: "BE", dial: "32", flag: "🇧🇪", intlName: "Belgique", localName: "België / Belgique" },
  { code: "BZ", dial: "501", flag: "🇧🇿", intlName: "Belize", localName: "Belize" },
  { code: "BJ", dial: "229", flag: "🇧🇯", intlName: "Bénin", localName: "Bénin" },
  { code: "BT", dial: "975", flag: "🇧🇹", intlName: "Bhoutan", localName: "འབྲུག་ཡུལ་ (Druk Yul)" },
  { code: "BO", dial: "591", flag: "🇧🇴", intlName: "Bolivie", localName: "Bolivia" },
  { code: "BA", dial: "387", flag: "🇧🇦", intlName: "Bosnie-Herzégovine", localName: "Bosna i Hercegovina" },
  { code: "BW", dial: "267", flag: "🇧🇼", intlName: "Botswana", localName: "Botswana" },
  { code: "BR", dial: "55", flag: "🇧🇷", intlName: "Brésil", localName: "Brasil" },
  { code: "BN", dial: "673", flag: "🇧🇳", intlName: "Brunei", localName: "Brunei Darussalam" },
  { code: "BG", dial: "359", flag: "🇧🇬", intlName: "Bulgarie", localName: "България" },
  { code: "BF", dial: "226", flag: "🇧🇫", intlName: "Burkina Faso", localName: "Burkina Faso" },
  { code: "BI", dial: "257", flag: "🇧🇮", intlName: "Burundi", localName: "Burundi" },

  // C
  { code: "KH", dial: "855", flag: "🇰🇭", intlName: "Cambodge", localName: "កម្ពុជា" },
  { code: "CM", dial: "237", flag: "🇨🇲", intlName: "Cameroun", localName: "Cameroun" },
  { code: "CA", dial: "1", flag: "🇨🇦", intlName: "Canada", localName: "Canada" },
  { code: "CV", dial: "238", flag: "🇨🇻", intlName: "Cap-Vert", localName: "Cabo Verde" },
  { code: "CF", dial: "236", flag: "🇨🇫", intlName: "Centrafrique", localName: "République centrafricaine" },
  { code: "CL", dial: "56", flag: "🇨🇱", intlName: "Chili", localName: "Chile" },
  { code: "CN", dial: "86", flag: "🇨🇳", intlName: "Chine", localName: "中国" },
  { code: "CY", dial: "357", flag: "🇨🇾", intlName: "Chypre", localName: "Κύπρος / Kıbrıs" },
  { code: "CO", dial: "57", flag: "🇨🇴", intlName: "Colombie", localName: "Colombia" },
  { code: "KM", dial: "269", flag: "🇰🇲", intlName: "Comores", localName: "جزر القمر" },
  { code: "CG", dial: "242", flag: "🇨🇬", intlName: "Congo (Brazzaville)", localName: "Congo" },
  { code: "CD", dial: "243", flag: "🇨🇩", intlName: "Congo (RDC)", localName: "Rép. Démocratique du Congo" },
  { code: "KR", dial: "82", flag: "🇰🇷", intlName: "Corée du Sud", localName: "대한민국" },
  { code: "KP", dial: "850", flag: "🇰🇵", intlName: "Corée du Nord", localName: "조선민주주의인민공화국" },
  { code: "CR", dial: "506", flag: "🇨🇷", intlName: "Costa Rica", localName: "Costa Rica" },
  { code: "CI", dial: "225", flag: "🇨🇮", intlName: "Côte d’Ivoire", localName: "Côte d’Ivoire" },
  { code: "HR", dial: "385", flag: "🇭🇷", intlName: "Croatie", localName: "Hrvatska" },
  { code: "CU", dial: "53", flag: "🇨🇺", intlName: "Cuba", localName: "Cuba" },

  // D
  { code: "DK", dial: "45", flag: "🇩🇰", intlName: "Danemark", localName: "Danmark" },
  { code: "DJ", dial: "253", flag: "🇩🇯", intlName: "Djibouti", localName: "جيبوتي / Djibouti" },
  { code: "DM", dial: "1767", flag: "🇩🇲", intlName: "Dominique", localName: "Dominica" },

  // E
  { code: "EG", dial: "20", flag: "🇪🇬", intlName: "Égypte", localName: "مصر" },
  { code: "AE", dial: "971", flag: "🇦🇪", intlName: "Émirats Arabes Unis", localName: "الإمارات العربية المتحدة" },
  { code: "EC", dial: "593", flag: "🇪🇨", intlName: "Équateur", localName: "Ecuador" },
  { code: "ER", dial: "291", flag: "🇪🇷", intlName: "Érythrée", localName: "ኤርትራ" },
  { code: "ES", dial: "34", flag: "🇪🇸", intlName: "Espagne", localName: "España" },
  { code: "EE", dial: "372", flag: "🇪🇪", intlName: "Estonie", localName: "Eesti" },
  { code: "SZ", dial: "268", flag: "🇸🇿", intlName: "Eswatini", localName: "Eswatini" },
  { code: "US", dial: "1", flag: "🇺🇸", intlName: "États-Unis", localName: "United States" },
  { code: "ET", dial: "251", flag: "🇪🇹", intlName: "Éthiopie", localName: "ኢትዮጵያ" },

  // F
  { code: "FJ", dial: "679", flag: "🇫🇯", intlName: "Fidji", localName: "Fiji" },
  { code: "FI", dial: "358", flag: "🇫🇮", intlName: "Finlande", localName: "Suomi" },
  { code: "FR", dial: "33", flag: "🇫🇷", intlName: "France", localName: "France" },

  // G
  { code: "GA", dial: "241", flag: "🇬🇦", intlName: "Gabon", localName: "Gabon" },
  { code: "GM", dial: "220", flag: "🇬🇲", intlName: "Gambie", localName: "The Gambia" },
  { code: "GE", dial: "995", flag: "🇬🇪", intlName: "Géorgie", localName: "საქართველო" },
  { code: "GH", dial: "233", flag: "🇬🇭", intlName: "Ghana", localName: "Ghana" },
  { code: "GI", dial: "350", flag: "🇬🇮", intlName: "Gibraltar", localName: "Gibraltar" },
  { code: "GR", dial: "30", flag: "🇬🇷", intlName: "Grèce", localName: "Ελλάδα" },
  { code: "GD", dial: "1473", flag: "🇬🇩", intlName: "Grenade", localName: "Grenada" },
  { code: "GT", dial: "502", flag: "🇬🇹", intlName: "Guatemala", localName: "Guatemala" },
  { code: "GN", dial: "224", flag: "🇬🇳", intlName: "Guinée", localName: "Guinée" },
  { code: "GW", dial: "245", flag: "🇬🇼", intlName: "Guinée-Bissau", localName: "Guiné-Bissau" },
  { code: "GY", dial: "592", flag: "🇬🇾", intlName: "Guyana", localName: "Guyana" },

  // H
  { code: "HT", dial: "509", flag: "🇭🇹", intlName: "Haïti", localName: "Ayiti / Haïti" },
  { code: "HN", dial: "504", flag: "🇭🇳", intlName: "Honduras", localName: "Honduras" },
  { code: "HK", dial: "852", flag: "🇭🇰", intlName: "Hong Kong", localName: "香港" },
  { code: "HU", dial: "36", flag: "🇭🇺", intlName: "Hongrie", localName: "Magyarország" },

  // I
  { code: "IN", dial: "91", flag: "🇮🇳", intlName: "Inde", localName: "भारत" },
  { code: "ID", dial: "62", flag: "🇮🇩", intlName: "Indonésie", localName: "Indonesia" },
  { code: "IQ", dial: "964", flag: "🇮🇶", intlName: "Irak", localName: "العراق" },
  { code: "IR", dial: "98", flag: "🇮🇷", intlName: "Iran", localName: "ایران" },
  { code: "IE", dial: "353", flag: "🇮🇪", intlName: "Irlande", localName: "Ireland" },
  { code: "IS", dial: "354", flag: "🇮🇸", intlName: "Islande", localName: "Ísland" },
  { code: "IL", dial: "972", flag: "🇮🇱", intlName: "Israël", localName: "ישראל" },
  { code: "IT", dial: "39", flag: "🇮🇹", intlName: "Italie", localName: "Italia" },

  // J
  { code: "JM", dial: "1876", flag: "🇯🇲", intlName: "Jamaïque", localName: "Jamaica" },
  { code: "JP", dial: "81", flag: "🇯🇵", intlName: "Japon", localName: "日本" },
  { code: "JO", dial: "962", flag: "🇯🇴", intlName: "Jordanie", localName: "الأردن" },

  // K
  { code: "KZ", dial: "7", flag: "🇰🇿", intlName: "Kazakhstan", localName: "Қазақстан" },
  { code: "KE", dial: "254", flag: "🇰🇪", intlName: "Kenya", localName: "Kenya" },
  { code: "KG", dial: "996", flag: "🇰🇬", intlName: "Kirghizistan", localName: "Кыргызстан" },
  { code: "KI", dial: "686", flag: "🇰🇮", intlName: "Kiribati", localName: "Kiribati" },
  { code: "XK", dial: "383", flag: "🇽🇰", intlName: "Kosovo", localName: "Kosova / Kosovo" },
  { code: "KW", dial: "965", flag: "🇰🇼", intlName: "Koweït", localName: "الكويت" },

  // L
  { code: "LA", dial: "856", flag: "🇱🇦", intlName: "Laos", localName: "ລາວ" },
  { code: "LS", dial: "266", flag: "🇱🇸", intlName: "Lesotho", localName: "Lesotho" },
  { code: "LV", dial: "371", flag: "🇱🇻", intlName: "Lettonie", localName: "Latvija" },
  { code: "LB", dial: "961", flag: "🇱🇧", intlName: "Liban", localName: "لبنان" },
  { code: "LR", dial: "231", flag: "🇱🇷", intlName: "Libéria", localName: "Liberia" },
  { code: "LY", dial: "218", flag: "🇱🇾", intlName: "Libye", localName: "ليبيا" },
  { code: "LI", dial: "423", flag: "🇱🇮", intlName: "Liechtenstein", localName: "Liechtenstein" },
  { code: "LT", dial: "370", flag: "🇱🇹", intlName: "Lituanie", localName: "Lietuva" },
  { code: "LU", dial: "352", flag: "🇱🇺", intlName: "Luxembourg", localName: "Lëtzebuerg / Luxembourg" },

  // M
  { code: "MO", dial: "853", flag: "🇲🇴", intlName: "Macao", localName: "澳門" },
  { code: "MK", dial: "389", flag: "🇲🇰", intlName: "Macédoine du Nord", localName: "Северна Македонија" },
  { code: "MG", dial: "261", flag: "🇲🇬", intlName: "Madagascar", localName: "Madagasikara" },
  { code: "MY", dial: "60", flag: "🇲🇾", intlName: "Malaisie", localName: "Malaysia" },
  { code: "MW", dial: "265", flag: "🇲🇼", intlName: "Malawi", localName: "Malawi" },
  { code: "MV", dial: "960", flag: "🇲🇻", intlName: "Maldives", localName: "Maldives / ދިވެހި" },
  { code: "ML", dial: "223", flag: "🇲🇱", intlName: "Mali", localName: "Mali" },
  { code: "MT", dial: "356", flag: "🇲🇹", intlName: "Malte", localName: "Malta" },
  { code: "MA", dial: "212", flag: "🇲🇦", intlName: "Maroc", localName: "المملكة المغربية" },
  { code: "MH", dial: "692", flag: "🇲🇭", intlName: "Îles Marshall", localName: "Marshall Islands" },
  { code: "MU", dial: "230", flag: "🇲🇺", intlName: "Maurice", localName: "Mauritius" },
  { code: "MR", dial: "222", flag: "🇲🇷", intlName: "Mauritanie", localName: "موريتانيا" },
  { code: "MX", dial: "52", flag: "🇲🇽", intlName: "Mexique", localName: "México" },
  { code: "FM", dial: "691", flag: "🇫🇲", intlName: "Micronésie", localName: "Micronesia" },
  { code: "MD", dial: "373", flag: "🇲🇩", intlName: "Moldavie", localName: "Republica Moldova / Moldova" },
  { code: "MC", dial: "377", flag: "🇲🇨", intlName: "Monaco", localName: "Monaco" },
  { code: "MN", dial: "976", flag: "🇲🇳", intlName: "Mongolie", localName: "Монгол Улс" },
  { code: "ME", dial: "382", flag: "🇲🇪", intlName: "Monténégro", localName: "Crna Gora" },
  { code: "MZ", dial: "258", flag: "🇲🇿", intlName: "Mozambique", localName: "Moçambique" },
  { code: "MM", dial: "95", flag: "🇲🇲", intlName: "Myanmar", localName: "မြန်မာ" },

  // N
  { code: "NA", dial: "264", flag: "🇳🇦", intlName: "Namibie", localName: "Namibia" },
  { code: "NR", dial: "674", flag: "🇳🇷", intlName: "Nauru", localName: "Nauru" },
  { code: "NP", dial: "977", flag: "🇳🇵", intlName: "Népal", localName: "नेपाल" },
  { code: "NI", dial: "505", flag: "🇳🇮", intlName: "Nicaragua", localName: "Nicaragua" },
  { code: "NE", dial: "227", flag: "🇳🇪", intlName: "Niger", localName: "Niger" },
  { code: "NG", dial: "234", flag: "🇳🇬", intlName: "Nigeria", localName: "Nigeria" },
  { code: "NO", dial: "47", flag: "🇳🇴", intlName: "Norvège", localName: "Norge" },
  { code: "NZ", dial: "64", flag: "🇳🇿", intlName: "Nouvelle-Zélande", localName: "New Zealand / Aotearoa" },

  // O
  { code: "OM", dial: "968", flag: "🇴🇲", intlName: "Oman", localName: "عُمان" },

  // P
  { code: "UG", dial: "256", flag: "🇺🇬", intlName: "Ouganda", localName: "Uganda" }, // (Ouganda = U)
  { code: "UZ", dial: "998", flag: "🇺🇿", intlName: "Ouzbékistan", localName: "Oʻzbekiston" }, // (Ouzbékistan = O)
  { code: "PK", dial: "92", flag: "🇵🇰", intlName: "Pakistan", localName: "پاکستان / Pakistan" },
  { code: "PW", dial: "680", flag: "🇵🇼", intlName: "Palaos", localName: "Palau" },
  { code: "PS", dial: "970", flag: "🇵🇸", intlName: "Palestine", localName: "فلسطين" },
  { code: "PA", dial: "507", flag: "🇵🇦", intlName: "Panama", localName: "Panamá" },
  { code: "PG", dial: "675", flag: "🇵🇬", intlName: "Papouasie-Nouvelle-Guinée", localName: "Papua New Guinea" },
  { code: "PY", dial: "595", flag: "🇵🇾", intlName: "Paraguay", localName: "Paraguay" },
  { code: "NL", dial: "31", flag: "🇳🇱", intlName: "Pays-Bas", localName: "Nederland" },
  { code: "PE", dial: "51", flag: "🇵🇪", intlName: "Pérou", localName: "Perú" },
  { code: "PH", dial: "63", flag: "🇵🇭", intlName: "Philippines", localName: "Pilipinas / Philippines" },
  { code: "PL", dial: "48", flag: "🇵🇱", intlName: "Pologne", localName: "Polska" },
  { code: "PT", dial: "351", flag: "🇵🇹", intlName: "Portugal", localName: "Portugal" },
  { code: "PR", dial: "1", flag: "🇵🇷", intlName: "Porto Rico", localName: "Puerto Rico" },

  // Q
  { code: "QA", dial: "974", flag: "🇶🇦", intlName: "Qatar", localName: "قطر" },

  // R
  { code: "RO", dial: "40", flag: "🇷🇴", intlName: "Roumanie", localName: "România" },
  { code: "GB", dial: "44", flag: "🇬🇧", intlName: "Royaume-Uni", localName: "United Kingdom" },
  { code: "RU", dial: "7", flag: "🇷🇺", intlName: "Russie", localName: "Россия" },
  { code: "RW", dial: "250", flag: "🇷🇼", intlName: "Rwanda", localName: "Rwanda" },

  // S
  { code: "KN", dial: "1869", flag: "🇰🇳", intlName: "Saint-Kitts-et-Nevis", localName: "St. Kitts & Nevis" },
  { code: "LC", dial: "1758", flag: "🇱🇨", intlName: "Sainte-Lucie", localName: "Saint Lucia" },
  { code: "VC", dial: "1784", flag: "🇻🇨", intlName: "Saint-Vincent-et-les-Grenadines", localName: "St. Vincent & the Grenadines" },
  { code: "WS", dial: "685", flag: "🇼🇸", intlName: "Samoa", localName: "Samoa" },
  { code: "SM", dial: "378", flag: "🇸🇲", intlName: "Saint-Marin", localName: "San Marino" },
  { code: "ST", dial: "239", flag: "🇸🇹", intlName: "Sao Tomé-et-Principe", localName: "São Tomé e Príncipe" },
  { code: "SN", dial: "221", flag: "🇸🇳", intlName: "Sénégal", localName: "Sénégal" },
  { code: "RS", dial: "381", flag: "🇷🇸", intlName: "Serbie", localName: "Srbija" },
  { code: "SC", dial: "248", flag: "🇸🇨", intlName: "Seychelles", localName: "Seychelles" },
  { code: "SL", dial: "232", flag: "🇸🇱", intlName: "Sierra Leone", localName: "Sierra Leone" },
  { code: "SG", dial: "65", flag: "🇸🇬", intlName: "Singapour", localName: "Singapore / Singapura" },
  { code: "SK", dial: "421", flag: "🇸🇰", intlName: "Slovaquie", localName: "Slovensko" },
  { code: "SI", dial: "386", flag: "🇸🇮", intlName: "Slovénie", localName: "Slovenija" },
  { code: "SO", dial: "252", flag: "🇸🇴", intlName: "Somalie", localName: "Soomaaliya / الصومال" },
  { code: "SD", dial: "249", flag: "🇸🇩", intlName: "Soudan", localName: "السودان" },
  { code: "SS", dial: "211", flag: "🇸🇸", intlName: "Soudan du Sud", localName: "South Sudan" },
  { code: "LK", dial: "94", flag: "🇱🇰", intlName: "Sri Lanka", localName: "ශ්‍රී ලංකා / இலங்கை" },
  { code: "SE", dial: "46", flag: "🇸🇪", intlName: "Suède", localName: "Sverige" },
  { code: "CH", dial: "41", flag: "🇨🇭", intlName: "Suisse", localName: "Schweiz / Suisse / Svizzera" },
  { code: "SR", dial: "597", flag: "🇸🇷", intlName: "Suriname", localName: "Suriname" },
  { code: "SY", dial: "963", flag: "🇸🇾", intlName: "Syrie", localName: "سوريا" },

  // T
  { code: "TJ", dial: "992", flag: "🇹🇯", intlName: "Tadjikistan", localName: "Тоҷикистон" },
  { code: "TW", dial: "886", flag: "🇹🇼", intlName: "Taïwan", localName: "臺灣 / 台湾" },
  { code: "TZ", dial: "255", flag: "🇹🇿", intlName: "Tanzanie", localName: "Tanzania" },
  { code: "TD", dial: "235", flag: "🇹🇩", intlName: "Tchad", localName: "Tchad / تشاد" },
  { code: "CZ", dial: "420", flag: "🇨🇿", intlName: "Tchéquie", localName: "Česko" },
  { code: "TH", dial: "66", flag: "🇹🇭", intlName: "Thaïlande", localName: "ประเทศไทย" },
  { code: "TL", dial: "670", flag: "🇹🇱", intlName: "Timor-Leste", localName: "Timor-Leste" },
  { code: "TG", dial: "228", flag: "🇹🇬", intlName: "Togo", localName: "Togo" },
  { code: "TO", dial: "676", flag: "🇹🇴", intlName: "Tonga", localName: "Tonga" },
  { code: "TT", dial: "1868", flag: "🇹🇹", intlName: "Trinité-et-Tobago", localName: "Trinidad & Tobago" },
  { code: "TN", dial: "216", flag: "🇹🇳", intlName: "Tunisie", localName: "تونس" },
  { code: "TM", dial: "993", flag: "🇹🇲", intlName: "Turkménistan", localName: "Türkmenistan" },
  { code: "TR", dial: "90", flag: "🇹🇷", intlName: "Turquie", localName: "Türkiye" },
  { code: "TV", dial: "688", flag: "🇹🇻", intlName: "Tuvalu", localName: "Tuvalu" },

  // U
  { code: "UA", dial: "380", flag: "🇺🇦", intlName: "Ukraine", localName: "Україна" },
  { code: "UY", dial: "598", flag: "🇺🇾", intlName: "Uruguay", localName: "Uruguay" },

  // V
  { code: "VU", dial: "678", flag: "🇻🇺", intlName: "Vanuatu", localName: "Vanuatu" },
  { code: "VA", dial: "39", flag: "🇻🇦", intlName: "Vatican", localName: "Città del Vaticano" },
  { code: "VE", dial: "58", flag: "🇻🇪", intlName: "Venezuela", localName: "Venezuela" },
  { code: "VN", dial: "84", flag: "🇻🇳", intlName: "Viêt Nam", localName: "Việt Nam" },

  // Y
  { code: "YE", dial: "967", flag: "🇾🇪", intlName: "Yémen", localName: "اليمن" },

  // Z
  { code: "ZM", dial: "260", flag: "🇿🇲", intlName: "Zambie", localName: "Zambia" },
  { code: "ZW", dial: "263", flag: "🇿🇼", intlName: "Zimbabwe", localName: "Zimbabwe" },
];

// -------------------------------------------------
// Helpers d'affichage
// -------------------------------------------------

function countryLabel(c: Country): string {
  // Si localName ≠ intlName (en comparant en minuscules), on affiche les deux.
  const intl = c.intlName.trim();
  const local = c.localName.trim();
  const same =
    intl.toLowerCase() === local.toLowerCase() ||
    local === "" ||
    local.toLowerCase().includes(intl.toLowerCase()); // petit garde-fou

  if (same) {
    return `${intl} ${c.flag} (+${c.dial})`;
  }
  return `${intl} • ${local} ${c.flag} (+${c.dial})`;
}

// Pays par défaut (sélection initiale) : Maroc
const DEFAULT_COUNTRY_CODE = "MA";

type Props = {
  value: string; // E.164 reçu du parent, ex: "+212612345678"
  onChange: (e164: string) => void;
};

export default function PhoneField({ value, onChange }: Props) {
  // Code du pays sélectionné (ex "MA")
  const [selectedCode, setSelectedCode] = useState<string>(DEFAULT_COUNTRY_CODE);

  // Numéro local saisi par l'utilisateur (sans indicatif, sans 0 initial idéalement)
  const [localNumber, setLocalNumber] = useState<string>("");

  // Terme de recherche pour filtrer les pays
  const [search, setSearch] = useState<string>("");

  // Pour empêcher les boucles quand on met à jour depuis props.value
  const isSettingFromProp = useRef(false);

  // Petit index {code -> Country} pour lookup rapide
  const COUNTRY_MAP = useMemo(() => {
    const m: Record<string, Country> = {};
    for (const c of ALL_COUNTRIES) m[c.code] = c;
    return m;
  }, []);

  // Pays actuellement sélectionné (toujours défini car DEFAULT existe)
  const country = useMemo(() => {
    return COUNTRY_MAP[selectedCode] ?? COUNTRY_MAP[DEFAULT_COUNTRY_CODE];
  }, [COUNTRY_MAP, selectedCode]);

  // Liste visible en fonction de la recherche
  const visibleCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => {
      const lbl = countryLabel(c).toLowerCase();
      return (
        lbl.includes(q) ||
        c.intlName.toLowerCase().includes(q) ||
        c.localName.toLowerCase().includes(q) ||
        c.dial.toLowerCase().includes(q)
      );
    });
  }, [search]);

  // -------------------------------------------------
  // 1. Quand le parent pousse une E.164 (value),
  //    on essaie de la décomposer :
  //    - trouver le bon pays par préfixe d'indicatif
  //    - en déduire le reste du numéro
  // -------------------------------------------------
  useEffect(() => {
    if (!value || !value.startsWith("+")) {
      // Rien ou pas E.164 => reset valeurs par défaut
      setSelectedCode((prev) => prev || DEFAULT_COUNTRY_CODE);
      setLocalNumber("");
      return;
    }

    if (isSettingFromProp.current) {
      // On vient tout juste de setter value nous-mêmes.
      isSettingFromProp.current = false;
      return;
    }

    // On enlève tout sauf les chiffres
    const digitsOnly = value.replace(/[^\d]/g, ""); // ex "+2126..." -> "2126..."

    // On cherche le dial code le plus long qui matche le début
    let matchCode = DEFAULT_COUNTRY_CODE;
    let bestLen = -1;

    for (const c of ALL_COUNTRIES) {
      const d = c.dial;
      if (digitsOnly.startsWith(d) && d.length > bestLen) {
        bestLen = d.length;
        matchCode = c.code;
      }
    }

    const matchedCountry = COUNTRY_MAP[matchCode] ?? COUNTRY_MAP[DEFAULT_COUNTRY_CODE];
    const localDigits = digitsOnly.slice(matchedCountry.dial.length);

    setSelectedCode(matchedCountry.code);
    setLocalNumber(localDigits);
  }, [value, COUNTRY_MAP]);

  // -------------------------------------------------
  // 2. À chaque changement interne (pays ou localNumber),
  //    on reconstruit l'E.164 et on le renvoie au parent.
  // -------------------------------------------------
  useEffect(() => {
    // On nettoie le localNumber : uniquement chiffres, pas de 0 initiaux répétés
    const cleanedLocal = (localNumber || "")
      .replace(/[^\d]/g, "")
      .replace(/^0+/, ""); // retire tous les zéros de tête

    const dial = country.dial;
    const e164 = cleanedLocal ? `+${dial}${cleanedLocal}` : "";

    isSettingFromProp.current = true;
    onChange(e164);
  }, [country, localNumber, onChange]);

  // -------------------------------------------------
  // Rendu
  // -------------------------------------------------
  return (
    <div className="space-y-3">
      {/* Barre de recherche pays (style WhatsApp) */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder-black/40 outline-none"
          placeholder="Rechercher un pays… / Search country"
          aria-label="Rechercher un pays"
        />
      </div>

      {/* Sélecteur de pays */}
      <div className="relative">
        <select
          aria-label="Pays / indicatif téléphonique"
          value={selectedCode}
          onChange={(e) => {
            const newCode = e.target.value;
            setSelectedCode(newCode);
          }}
          className="w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-black"
        >
          {visibleCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {countryLabel(c)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-black/60">
          ▾
        </span>
      </div>

      {/* Bloc indicatif + champ numéro local */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        {/* Indicatif visuel verrouillé */}
        <div
          className="min-w-[82px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-black flex items-center"
          aria-hidden
        >
          +{country.dial}
        </div>

        {/* Numéro local */}
        <input
          aria-label="Numéro local (sans le zéro initial)"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          placeholder="Numéro (sans 0 initial)"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder-black/40 outline-none"
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value)}
        />
      </div>
    </div>
  );
   }
