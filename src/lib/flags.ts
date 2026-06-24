// Country → ISO 3166-1 alpha-2 lookup for flagcdn.com photographic flag images.
export const COUNTRY_CODES: Record<string, string> = {
  "Afghanistan":"af","Albania":"al","Algeria":"dz","Andorra":"ad","Angola":"ao",
  "Argentina":"ar","Armenia":"am","Australia":"au","Austria":"at","Azerbaijan":"az",
  "Bahamas":"bs","Bahrain":"bh","Bangladesh":"bd","Barbados":"bb","Belarus":"by",
  "Belgium":"be","Belize":"bz","Benin":"bj","Bhutan":"bt","Bolivia":"bo",
  "Bosnia and Herzegovina":"ba","Botswana":"bw","Brazil":"br","Brunei":"bn",
  "Bulgaria":"bg","Burkina Faso":"bf","Burundi":"bi","Cambodia":"kh","Cameroon":"cm",
  "Canada":"ca","Cape Verde":"cv","Central African Republic":"cf","Chad":"td",
  "Chile":"cl","China":"cn","Colombia":"co","Comoros":"km","Congo":"cg",
  "Costa Rica":"cr","Croatia":"hr","Cuba":"cu","Cyprus":"cy","Czech Republic":"cz",
  "Denmark":"dk","Djibouti":"dj","Dominica":"dm","Dominican Republic":"do",
  "Ecuador":"ec","Egypt":"eg","El Salvador":"sv","Equatorial Guinea":"gq",
  "Eritrea":"er","Estonia":"ee","Eswatini":"sz","Ethiopia":"et","Fiji":"fj",
  "Finland":"fi","France":"fr","Gabon":"ga","Gambia":"gm","Georgia":"ge",
  "Germany":"de","Ghana":"gh","Greece":"gr","Grenada":"gd","Guatemala":"gt",
  "Guinea":"gn","Guinea-Bissau":"gw","Guyana":"gy","Haiti":"ht","Honduras":"hn",
  "Hungary":"hu","Iceland":"is","India":"in","Indonesia":"id","Iran":"ir",
  "Iraq":"iq","Ireland":"ie","Israel":"il","Italy":"it","Ivory Coast":"ci",
  "Jamaica":"jm","Japan":"jp","Jordan":"jo","Kazakhstan":"kz","Kenya":"ke",
  "Kiribati":"ki","Kuwait":"kw","Kyrgyzstan":"kg","Laos":"la","Latvia":"lv",
  "Lebanon":"lb","Lesotho":"ls","Liberia":"lr","Libya":"ly","Liechtenstein":"li",
  "Lithuania":"lt","Luxembourg":"lu","Madagascar":"mg","Malawi":"mw",
  "Malaysia":"my","Maldives":"mv","Mali":"ml","Malta":"mt","Mauritania":"mr",
  "Mauritius":"mu","Mexico":"mx","Moldova":"md","Monaco":"mc","Mongolia":"mn",
  "Montenegro":"me","Morocco":"ma","Mozambique":"mz","Myanmar":"mm","Namibia":"na",
  "Nepal":"np","Netherlands":"nl","New Zealand":"nz","Nicaragua":"ni","Niger":"ne",
  "Nigeria":"ng","North Macedonia":"mk","Norway":"no","Oman":"om","Pakistan":"pk",
  "Palestine":"ps","Panama":"pa","Papua New Guinea":"pg","Paraguay":"py","Peru":"pe",
  "Philippines":"ph","Poland":"pl","Portugal":"pt","Qatar":"qa","Romania":"ro",
  "Rwanda":"rw","Saint Lucia":"lc","Samoa":"ws","San Marino":"sm",
  "Saudi Arabia":"sa","Senegal":"sn","Serbia":"rs","Seychelles":"sc",
  "Sierra Leone":"sl","Singapore":"sg","Slovakia":"sk","Slovenia":"si",
  "Somalia":"so","South Africa":"za","South Korea":"kr","South Sudan":"ss",
  "Spain":"es","Sri Lanka":"lk","Sudan":"sd","Suriname":"sr","Sweden":"se",
  "Switzerland":"ch","Syria":"sy","Taiwan":"tw","Tajikistan":"tj","Tanzania":"tz",
  "Thailand":"th","Togo":"tg","Tonga":"to","Trinidad and Tobago":"tt",
  "Tunisia":"tn","Turkey":"tr","Turkmenistan":"tm","Uganda":"ug","Ukraine":"ua",
  "United Arab Emirates":"ae","United Kingdom":"gb","United States":"us",
  "Uruguay":"uy","Uzbekistan":"uz","Vanuatu":"vu","Vatican City":"va",
  "Venezuela":"ve","Vietnam":"vn","Yemen":"ye","Zambia":"zm","Zimbabwe":"zw",
};

export function getFlagUrl(
  country: string | null | undefined,
  size: "w20" | "w40" | "w80" | "w160" | "w320" = "w160",
): string {
  if (!country) return `https://flagcdn.com/${size}/un.png`;
  const code = COUNTRY_CODES[country];
  if (!code) return `https://flagcdn.com/${size}/un.png`;
  return `https://flagcdn.com/${size}/${code}.png`;
}

export function getFlagThumb(country: string | null | undefined): string {
  return getFlagUrl(country, "w40");
}
