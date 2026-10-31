export const CUISINE_FLAGS: Record<string, string> = {
  indian: "\u{1F1EE}\u{1F1F3}", korean: "\u{1F1F0}\u{1F1F7}", japanese: "\u{1F1EF}\u{1F1F5}", chinese: "\u{1F1E8}\u{1F1F3}", thai: "\u{1F1F9}\u{1F1ED}",
  vietnamese: "\u{1F1FB}\u{1F1F3}", mexican: "\u{1F1F2}\u{1F1FD}", italian: "\u{1F1EE}\u{1F1F9}", french: "\u{1F1EB}\u{1F1F7}", spanish: "\u{1F1EA}\u{1F1F8}",
  greek: "\u{1F1EC}\u{1F1F7}", turkish: "\u{1F1F9}\u{1F1F7}", lebanese: "\u{1F1F1}\u{1F1E7}", arabian: "\u{1F1F8}\u{1F1E6}", arab: "\u{1F1F8}\u{1F1E6}",
  persian: "\u{1F1EE}\u{1F1F7}", iranian: "\u{1F1EE}\u{1F1F7}", ethiopian: "\u{1F1EA}\u{1F1F9}", moroccan: "\u{1F1F2}\u{1F1E6}", egyptian: "\u{1F1EA}\u{1F1EC}",
  nigerian: "\u{1F1F3}\u{1F1EC}", brazilian: "\u{1F1E7}\u{1F1F7}", argentinian: "\u{1F1E6}\u{1F1F7}", peruvian: "\u{1F1F5}\u{1F1EA}",
  colombian: "\u{1F1E8}\u{1F1F4}", cuban: "\u{1F1E8}\u{1F1FA}", jamaican: "\u{1F1EF}\u{1F1F2}", hawaiian: "\u{1F1FA}\u{1F1F8}",
  american: "\u{1F1FA}\u{1F1F8}", cajun: "\u{1F1FA}\u{1F1F8}", southern: "\u{1F1FA}\u{1F1F8}", tex: "\u{1F1FA}\u{1F1F8}",
  british: "\u{1F1EC}\u{1F1E7}", english: "\u{1F1EC}\u{1F1E7}", irish: "\u{1F1EE}\u{1F1EA}", scottish: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
  german: "\u{1F1E9}\u{1F1EA}", polish: "\u{1F1F5}\u{1F1F1}", russian: "\u{1F1F7}\u{1F1FA}", ukrainian: "\u{1F1FA}\u{1F1E6}",
  swedish: "\u{1F1F8}\u{1F1EA}", norwegian: "\u{1F1F3}\u{1F1F4}", danish: "\u{1F1E9}\u{1F1F0}",
  portuguese: "\u{1F1F5}\u{1F1F9}", filipino: "\u{1F1F5}\u{1F1ED}", indonesian: "\u{1F1EE}\u{1F1E9}", malaysian: "\u{1F1F2}\u{1F1FE}",
  singaporean: "\u{1F1F8}\u{1F1EC}", taiwanese: "\u{1F1F9}\u{1F1FC}", nepali: "\u{1F1F3}\u{1F1F5}", pakistani: "\u{1F1F5}\u{1F1F0}",
  sri: "\u{1F1F1}\u{1F1F0}", bengali: "\u{1F1E7}\u{1F1E9}", bangladeshi: "\u{1F1E7}\u{1F1E9}", afghan: "\u{1F1E6}\u{1F1EB}",
  caribbean: "\u{1F1EF}\u{1F1F2}", african: "\u{1F30D}", asian: "\u{1F30F}", european: "\u{1F30D}",
  mediterranean: "\u{1FAD2}", latin: "\u{1F30E}", middle: "\u{1F30D}",
  sushi: "\u{1F1EF}\u{1F1F5}", ramen: "\u{1F1EF}\u{1F1F5}", pho: "\u{1F1FB}\u{1F1F3}", tacos: "\u{1F1F2}\u{1F1FD}", taco: "\u{1F1F2}\u{1F1FD}",
  pizza: "\u{1F1EE}\u{1F1F9}", pasta: "\u{1F1EE}\u{1F1F9}", curry: "\u{1F1EE}\u{1F1F3}", biryani: "\u{1F1EE}\u{1F1F3}",
  kimchi: "\u{1F1F0}\u{1F1F7}", bbq: "\u{1F1F0}\u{1F1F7}", kebab: "\u{1F1F9}\u{1F1F7}", falafel: "\u{1F1F1}\u{1F1E7}",
  dim: "\u{1F1E8}\u{1F1F3}", dumpling: "\u{1F1E8}\u{1F1F3}", wonton: "\u{1F1E8}\u{1F1F3}", pad: "\u{1F1F9}\u{1F1ED}",
  crepe: "\u{1F1EB}\u{1F1F7}", croissant: "\u{1F1EB}\u{1F1F7}", tapas: "\u{1F1EA}\u{1F1F8}", paella: "\u{1F1EA}\u{1F1F8}",
  gyro: "\u{1F1EC}\u{1F1F7}", shawarma: "\u{1F1F1}\u{1F1E7}", hummus: "\u{1F1F1}\u{1F1E7}", baklava: "\u{1F1F9}\u{1F1F7}",
  ceviche: "\u{1F1F5}\u{1F1EA}", empanada: "\u{1F1E6}\u{1F1F7}", arepa: "\u{1F1E8}\u{1F1F4}", jerk: "\u{1F1EF}\u{1F1F2}",
};

export function getCuisineFlag(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, flag] of Object.entries(CUISINE_FLAGS)) {
    if (lower.includes(key)) return flag;
  }
  return null;
}

export const FOOD_SUGGESTIONS = [
  "Japanese", "Italian", "Mexican", "Thai", "Korean BBQ",
  "Sushi", "Ramen", "Indian", "Mediterranean", "French bistro",
  "Street food", "Farm-to-table", "Chinese", "Vietnamese",
  "Pizza", "Tacos", "Biryani", "Pasta", "Dim Sum",
];
