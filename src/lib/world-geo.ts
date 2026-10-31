// Static states/provinces and major cities for instant autocomplete
// Covers top countries; falls back to Photon API for unlisted countries

export interface GeoRegion {
  name: string;
  abbr?: string;
}

// States/provinces by country code (ISO 3166-1 alpha-2, lowercase)
export const STATES: Record<string, GeoRegion[]> = {
  us: [
    { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" }, { name: "Arizona", abbr: "AZ" },
    { name: "Arkansas", abbr: "AR" }, { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" },
    { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" }, { name: "Florida", abbr: "FL" },
    { name: "Georgia", abbr: "GA" }, { name: "Hawaii", abbr: "HI" }, { name: "Idaho", abbr: "ID" },
    { name: "Illinois", abbr: "IL" }, { name: "Indiana", abbr: "IN" }, { name: "Iowa", abbr: "IA" },
    { name: "Kansas", abbr: "KS" }, { name: "Kentucky", abbr: "KY" }, { name: "Louisiana", abbr: "LA" },
    { name: "Maine", abbr: "ME" }, { name: "Maryland", abbr: "MD" }, { name: "Massachusetts", abbr: "MA" },
    { name: "Michigan", abbr: "MI" }, { name: "Minnesota", abbr: "MN" }, { name: "Mississippi", abbr: "MS" },
    { name: "Missouri", abbr: "MO" }, { name: "Montana", abbr: "MT" }, { name: "Nebraska", abbr: "NE" },
    { name: "Nevada", abbr: "NV" }, { name: "New Hampshire", abbr: "NH" }, { name: "New Jersey", abbr: "NJ" },
    { name: "New Mexico", abbr: "NM" }, { name: "New York", abbr: "NY" }, { name: "North Carolina", abbr: "NC" },
    { name: "North Dakota", abbr: "ND" }, { name: "Ohio", abbr: "OH" }, { name: "Oklahoma", abbr: "OK" },
    { name: "Oregon", abbr: "OR" }, { name: "Pennsylvania", abbr: "PA" }, { name: "Rhode Island", abbr: "RI" },
    { name: "South Carolina", abbr: "SC" }, { name: "South Dakota", abbr: "SD" }, { name: "Tennessee", abbr: "TN" },
    { name: "Texas", abbr: "TX" }, { name: "Utah", abbr: "UT" }, { name: "Vermont", abbr: "VT" },
    { name: "Virginia", abbr: "VA" }, { name: "Washington", abbr: "WA" }, { name: "West Virginia", abbr: "WV" },
    { name: "Wisconsin", abbr: "WI" }, { name: "Wyoming", abbr: "WY" }, { name: "District of Columbia", abbr: "DC" },
    { name: "Puerto Rico", abbr: "PR" },
  ],
  in: [
    { name: "Andhra Pradesh" }, { name: "Arunachal Pradesh" }, { name: "Assam" }, { name: "Bihar" },
    { name: "Chhattisgarh" }, { name: "Goa" }, { name: "Gujarat" }, { name: "Haryana" },
    { name: "Himachal Pradesh" }, { name: "Jharkhand" }, { name: "Karnataka" }, { name: "Kerala" },
    { name: "Madhya Pradesh" }, { name: "Maharashtra" }, { name: "Manipur" }, { name: "Meghalaya" },
    { name: "Mizoram" }, { name: "Nagaland" }, { name: "Odisha" }, { name: "Punjab" },
    { name: "Rajasthan" }, { name: "Sikkim" }, { name: "Tamil Nadu" }, { name: "Telangana" },
    { name: "Tripura" }, { name: "Uttar Pradesh" }, { name: "Uttarakhand" }, { name: "West Bengal" },
    { name: "Delhi" }, { name: "Chandigarh" }, { name: "Puducherry" }, { name: "Jammu and Kashmir" },
    { name: "Ladakh" },
  ],
  ca: [
    { name: "Ontario", abbr: "ON" }, { name: "Quebec", abbr: "QC" }, { name: "British Columbia", abbr: "BC" },
    { name: "Alberta", abbr: "AB" }, { name: "Manitoba", abbr: "MB" }, { name: "Saskatchewan", abbr: "SK" },
    { name: "Nova Scotia", abbr: "NS" }, { name: "New Brunswick", abbr: "NB" },
    { name: "Newfoundland and Labrador", abbr: "NL" }, { name: "Prince Edward Island", abbr: "PE" },
    { name: "Northwest Territories", abbr: "NT" }, { name: "Yukon", abbr: "YT" }, { name: "Nunavut", abbr: "NU" },
  ],
  gb: [
    { name: "England" }, { name: "Scotland" }, { name: "Wales" }, { name: "Northern Ireland" },
    { name: "London" }, { name: "Greater Manchester" }, { name: "West Midlands" }, { name: "West Yorkshire" },
    { name: "South Yorkshire" }, { name: "Merseyside" }, { name: "Tyne and Wear" }, { name: "Hampshire" },
    { name: "Kent" }, { name: "Essex" }, { name: "Lancashire" }, { name: "Surrey" }, { name: "Hertfordshire" },
    { name: "Devon" }, { name: "Norfolk" }, { name: "Suffolk" }, { name: "Oxfordshire" }, { name: "Cambridgeshire" },
    { name: "Somerset" }, { name: "Dorset" }, { name: "Cornwall" }, { name: "Nottinghamshire" },
    { name: "Derbyshire" }, { name: "Leicestershire" }, { name: "Warwickshire" }, { name: "Berkshire" },
    { name: "Edinburgh" }, { name: "Glasgow" }, { name: "Aberdeen" }, { name: "Dundee" },
  ],
  au: [
    { name: "New South Wales", abbr: "NSW" }, { name: "Victoria", abbr: "VIC" },
    { name: "Queensland", abbr: "QLD" }, { name: "Western Australia", abbr: "WA" },
    { name: "South Australia", abbr: "SA" }, { name: "Tasmania", abbr: "TAS" },
    { name: "Australian Capital Territory", abbr: "ACT" }, { name: "Northern Territory", abbr: "NT" },
  ],
  de: [
    { name: "Baden-Wurttemberg" }, { name: "Bavaria" }, { name: "Berlin" }, { name: "Brandenburg" },
    { name: "Bremen" }, { name: "Hamburg" }, { name: "Hesse" }, { name: "Lower Saxony" },
    { name: "Mecklenburg-Vorpommern" }, { name: "North Rhine-Westphalia" }, { name: "Rhineland-Palatinate" },
    { name: "Saarland" }, { name: "Saxony" }, { name: "Saxony-Anhalt" }, { name: "Schleswig-Holstein" },
    { name: "Thuringia" },
  ],
  fr: [
    { name: "Ile-de-France" }, { name: "Provence-Alpes-Cote d'Azur" }, { name: "Auvergne-Rhone-Alpes" },
    { name: "Occitanie" }, { name: "Nouvelle-Aquitaine" }, { name: "Hauts-de-France" },
    { name: "Grand Est" }, { name: "Brittany" }, { name: "Normandy" }, { name: "Pays de la Loire" },
    { name: "Centre-Val de Loire" }, { name: "Bourgogne-Franche-Comte" }, { name: "Corsica" },
  ],
  jp: [
    { name: "Tokyo" }, { name: "Osaka" }, { name: "Kanagawa" }, { name: "Aichi" }, { name: "Saitama" },
    { name: "Chiba" }, { name: "Hokkaido" }, { name: "Hyogo" }, { name: "Fukuoka" }, { name: "Shizuoka" },
    { name: "Ibaraki" }, { name: "Hiroshima" }, { name: "Kyoto" }, { name: "Niigata" }, { name: "Miyagi" },
    { name: "Nagano" }, { name: "Gifu" }, { name: "Gunma" }, { name: "Tochigi" }, { name: "Okayama" },
    { name: "Mie" }, { name: "Kumamoto" }, { name: "Kagoshima" }, { name: "Okinawa" }, { name: "Nara" },
  ],
  br: [
    { name: "Sao Paulo", abbr: "SP" }, { name: "Rio de Janeiro", abbr: "RJ" }, { name: "Minas Gerais", abbr: "MG" },
    { name: "Bahia", abbr: "BA" }, { name: "Parana", abbr: "PR" }, { name: "Rio Grande do Sul", abbr: "RS" },
    { name: "Pernambuco", abbr: "PE" }, { name: "Ceara", abbr: "CE" }, { name: "Para", abbr: "PA" },
    { name: "Santa Catarina", abbr: "SC" }, { name: "Goias", abbr: "GO" }, { name: "Maranhao", abbr: "MA" },
    { name: "Amazonas", abbr: "AM" }, { name: "Espirito Santo", abbr: "ES" }, { name: "Paraiba", abbr: "PB" },
    { name: "Mato Grosso", abbr: "MT" }, { name: "Distrito Federal", abbr: "DF" },
  ],
  mx: [
    { name: "Mexico City" }, { name: "Jalisco" }, { name: "Nuevo Leon" }, { name: "Estado de Mexico" },
    { name: "Veracruz" }, { name: "Puebla" }, { name: "Guanajuato" }, { name: "Chihuahua" },
    { name: "Tamaulipas" }, { name: "Baja California" }, { name: "Michoacan" }, { name: "Oaxaca" },
    { name: "Sinaloa" }, { name: "Sonora" }, { name: "Coahuila" }, { name: "Guerrero" },
    { name: "Quintana Roo" }, { name: "Yucatan" }, { name: "Chiapas" }, { name: "San Luis Potosi" },
  ],
  kr: [
    { name: "Seoul" }, { name: "Busan" }, { name: "Incheon" }, { name: "Daegu" }, { name: "Daejeon" },
    { name: "Gwangju" }, { name: "Ulsan" }, { name: "Sejong" }, { name: "Gyeonggi" },
    { name: "Gangwon" }, { name: "North Chungcheong" }, { name: "South Chungcheong" },
    { name: "North Jeolla" }, { name: "South Jeolla" }, { name: "North Gyeongsang" },
    { name: "South Gyeongsang" }, { name: "Jeju" },
  ],
  it: [
    { name: "Lombardy" }, { name: "Lazio" }, { name: "Campania" }, { name: "Veneto" }, { name: "Sicily" },
    { name: "Emilia-Romagna" }, { name: "Piedmont" }, { name: "Tuscany" }, { name: "Puglia" },
    { name: "Calabria" }, { name: "Sardinia" }, { name: "Liguria" }, { name: "Marche" },
    { name: "Abruzzo" }, { name: "Friuli Venezia Giulia" }, { name: "Trentino-Alto Adige" },
    { name: "Umbria" }, { name: "Basilicata" }, { name: "Molise" }, { name: "Valle d'Aosta" },
  ],
  es: [
    { name: "Andalusia" }, { name: "Catalonia" }, { name: "Madrid" }, { name: "Valencia" },
    { name: "Galicia" }, { name: "Castile and Leon" }, { name: "Basque Country" }, { name: "Castilla-La Mancha" },
    { name: "Canary Islands" }, { name: "Murcia" }, { name: "Aragon" }, { name: "Extremadura" },
    { name: "Balearic Islands" }, { name: "Asturias" }, { name: "Navarre" }, { name: "Cantabria" }, { name: "La Rioja" },
  ],
  nl: [
    { name: "North Holland" }, { name: "South Holland" }, { name: "Utrecht" }, { name: "North Brabant" },
    { name: "Gelderland" }, { name: "Overijssel" }, { name: "Limburg" }, { name: "Friesland" },
    { name: "Groningen" }, { name: "Drenthe" }, { name: "Flevoland" }, { name: "Zeeland" },
  ],
  sg: [{ name: "Singapore" }],
  ae: [
    { name: "Abu Dhabi" }, { name: "Dubai" }, { name: "Sharjah" }, { name: "Ajman" },
    { name: "Umm Al Quwain" }, { name: "Ras Al Khaimah" }, { name: "Fujairah" },
  ],
  za: [
    { name: "Gauteng" }, { name: "KwaZulu-Natal" }, { name: "Western Cape" }, { name: "Eastern Cape" },
    { name: "Mpumalanga" }, { name: "Limpopo" }, { name: "North West" }, { name: "Free State" },
    { name: "Northern Cape" },
  ],
  ng: [
    { name: "Lagos" }, { name: "Kano" }, { name: "Rivers" }, { name: "Oyo" }, { name: "Kaduna" },
    { name: "Abuja" }, { name: "Anambra" }, { name: "Ogun" }, { name: "Delta" }, { name: "Edo" },
    { name: "Enugu" }, { name: "Imo" }, { name: "Kwara" }, { name: "Osun" }, { name: "Ondo" },
  ],
  ph: [
    { name: "Metro Manila" }, { name: "Cebu" }, { name: "Davao" }, { name: "Cavite" },
    { name: "Bulacan" }, { name: "Laguna" }, { name: "Rizal" }, { name: "Pampanga" },
    { name: "Batangas" }, { name: "Pangasinan" }, { name: "Iloilo" }, { name: "Zambales" },
  ],
  id: [
    { name: "Jakarta" }, { name: "West Java" }, { name: "East Java" }, { name: "Central Java" },
    { name: "Bali" }, { name: "North Sumatra" }, { name: "South Sulawesi" }, { name: "Banten" },
    { name: "Yogyakarta" }, { name: "East Kalimantan" }, { name: "West Sumatra" }, { name: "Riau" },
  ],
  tr: [
    { name: "Istanbul" }, { name: "Ankara" }, { name: "Izmir" }, { name: "Antalya" }, { name: "Bursa" },
    { name: "Adana" }, { name: "Konya" }, { name: "Gaziantep" }, { name: "Mersin" }, { name: "Kayseri" },
    { name: "Eskisehir" }, { name: "Trabzon" }, { name: "Mugla" }, { name: "Denizli" },
  ],
  sa: [
    { name: "Riyadh" }, { name: "Makkah" }, { name: "Madinah" }, { name: "Eastern Province" },
    { name: "Asir" }, { name: "Tabuk" }, { name: "Hail" }, { name: "Jazan" }, { name: "Najran" },
    { name: "Al Baha" }, { name: "Qassim" }, { name: "Al Jawf" }, { name: "Northern Borders" },
  ],
};

// Cities by country code, keyed by state/province name (lowercase)
// For countries without state-level grouping, use "_" as the key
export const CITIES: Record<string, Record<string, string[]>> = {
  in: {
    "andhra pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Anantapur", "Kadapa"],
    "arunachal pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
    "assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur"],
    "bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Begusarai"],
    "chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"],
    "goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Mehsana", "Bharuch"],
    "haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Panchkula"],
    "himachal pradesh": ["Shimla", "Dharamshala", "Manali", "Mandi", "Solan", "Kullu"],
    "jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"],
    "karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belgaum", "Davangere", "Bellary", "Shimoga", "Tumkur", "Udupi"],
    "kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Palakkad", "Malappuram", "Munnar"],
    "madhya pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam"],
    "maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai", "Amravati", "Sangli", "Malegaon", "Akola", "Latur"],
    "manipur": ["Imphal", "Thoubal", "Bishnupur"],
    "meghalaya": ["Shillong", "Tura", "Jowai"],
    "mizoram": ["Aizawl", "Lunglei"],
    "nagaland": ["Kohima", "Dimapur", "Mokokchung"],
    "odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
    "punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot"],
    "rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Bharatpur", "Pushkar", "Jaisalmer", "Mount Abu"],
    "sikkim": ["Gangtok", "Namchi", "Pelling"],
    "tamil nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur", "Dindigul", "Pondicherry", "Ooty", "Kodaikanal"],
    "telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad"],
    "tripura": ["Agartala", "Udaipur"],
    "uttar pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Meerut", "Noida", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Mathura", "Firozabad", "Greater Noida"],
    "uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Roorkee", "Nainital", "Mussoorie"],
    "west bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur", "Darjeeling"],
    "delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Connaught Place", "Karol Bagh", "Lajpat Nagar"],
    "chandigarh": ["Chandigarh"],
    "puducherry": ["Puducherry", "Karaikal"],
    "jammu and kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Gulmarg"],
    "ladakh": ["Leh", "Kargil"],
  },
  ca: {
    "ontario": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor", "Richmond Hill", "Oakville", "Burlington", "Oshawa", "Barrie", "Kingston", "Guelph", "Thunder Bay", "Waterloo", "Cambridge", "Niagara Falls"],
    "quebec": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Levis", "Saguenay", "Trois-Rivieres", "Terrebonne"],
    "british columbia": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Kelowna", "Abbotsford", "Victoria", "Nanaimo", "Kamloops", "Chilliwack", "Prince George", "Whistler"],
    "alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Banff", "Jasper", "Canmore"],
    "manitoba": ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie"],
    "saskatchewan": ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current"],
    "nova scotia": ["Halifax", "Dartmouth", "Sydney", "Truro", "New Glasgow"],
    "new brunswick": ["Moncton", "Saint John", "Fredericton", "Dieppe", "Miramichi"],
    "newfoundland and labrador": ["St. John's", "Mount Pearl", "Corner Brook", "Conception Bay South"],
    "prince edward island": ["Charlottetown", "Summerside"],
    "northwest territories": ["Yellowknife", "Hay River", "Inuvik"],
    "yukon": ["Whitehorse", "Dawson City"],
    "nunavut": ["Iqaluit", "Rankin Inlet"],
  },
  gb: {
    "england": ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Nottingham", "Leicester", "Southampton", "Portsmouth", "Brighton", "Plymouth", "Reading", "Coventry", "Derby", "Stoke-on-Trent", "Wolverhampton", "Sunderland", "Oxford", "Cambridge", "York", "Bath", "Canterbury", "Chester", "Exeter", "Norwich", "Durham", "Winchester", "Salisbury", "Stratford-upon-Avon"],
    "scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Stirling", "Perth", "St Andrews"],
    "wales": ["Cardiff", "Swansea", "Newport", "Bangor", "Wrexham", "Aberystwyth"],
    "northern ireland": ["Belfast", "Derry", "Lisburn", "Newry", "Bangor"],
    "london": ["Westminster", "Camden", "Greenwich", "Hackney", "Islington", "Kensington", "Southwark", "Tower Hamlets", "Shoreditch", "Brixton", "Notting Hill", "Soho", "Mayfair", "Covent Garden", "Chelsea"],
    "greater manchester": ["Manchester", "Salford", "Bolton", "Stockport", "Oldham", "Rochdale", "Wigan", "Bury", "Trafford"],
    "west midlands": ["Birmingham", "Coventry", "Wolverhampton", "Dudley", "Walsall", "Solihull"],
    "west yorkshire": ["Leeds", "Bradford", "Huddersfield", "Wakefield", "Halifax"],
    "hampshire": ["Southampton", "Portsmouth", "Winchester", "Basingstoke", "Eastleigh", "Fareham"],
    "kent": ["Maidstone", "Canterbury", "Rochester", "Tunbridge Wells", "Folkestone", "Dover", "Margate"],
    "essex": ["Chelmsford", "Southend-on-Sea", "Colchester", "Basildon", "Harlow"],
    "surrey": ["Guildford", "Woking", "Epsom", "Reigate", "Farnham"],
    "oxfordshire": ["Oxford", "Banbury", "Abingdon", "Bicester", "Witney"],
    "cambridgeshire": ["Cambridge", "Peterborough", "Ely", "Huntingdon"],
    _: ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Edinburgh", "Glasgow", "Cardiff", "Belfast", "Nottingham", "Leicester", "Southampton", "Brighton", "Oxford", "Cambridge", "Bath", "York"],
  },
  au: {
    "new south wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast", "Coffs Harbour", "Wagga Wagga", "Albury", "Port Macquarie", "Tamworth", "Orange", "Dubbo", "Bathurst", "Lismore", "Byron Bay", "Blue Mountains"],
    "victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Mildura", "Warrnambool", "Frankston", "Dandenong", "Traralgon", "Phillip Island", "Great Ocean Road"],
    "queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Townsville", "Cairns", "Toowoomba", "Mackay", "Rockhampton", "Bundaberg", "Hervey Bay", "Noosa", "Airlie Beach"],
    "western australia": ["Perth", "Mandurah", "Bunbury", "Geraldton", "Kalgoorlie", "Albany", "Broome", "Karratha", "Margaret River", "Fremantle"],
    "south australia": ["Adelaide", "Mount Gambier", "Whyalla", "Murray Bridge", "Port Augusta", "Port Lincoln", "Victor Harbor", "Barossa Valley"],
    "tasmania": ["Hobart", "Launceston", "Devonport", "Burnie", "Cradle Mountain"],
    "australian capital territory": ["Canberra", "Queanbeyan"],
    "northern territory": ["Darwin", "Alice Springs", "Katherine", "Palmerston"],
  },
  de: {
    "bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Wurzburg", "Ingolstadt", "Fuerth", "Erlangen", "Bamberg", "Bayreuth", "Passau", "Garmisch-Partenkirchen"],
    "berlin": ["Berlin", "Mitte", "Kreuzberg", "Charlottenburg", "Prenzlauer Berg", "Neukolln", "Friedrichshain", "Schoneberg"],
    "north rhine-westphalia": ["Cologne", "Dusseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Munster", "Aachen", "Gelsenkirchen"],
    "baden-wurttemberg": ["Stuttgart", "Karlsruhe", "Mannheim", "Freiburg", "Heidelberg", "Ulm", "Heilbronn", "Pforzheim", "Reutlingen", "Tubingen", "Konstanz", "Baden-Baden"],
    "lower saxony": ["Hanover", "Braunschweig", "Oldenburg", "Osnabruck", "Wolfsburg", "Gottingen", "Hildesheim", "Celle"],
    "hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Marburg", "Giessen", "Fulda"],
    "hamburg": ["Hamburg", "Altona", "Eimsbuttel", "Harburg"],
    "saxony": ["Dresden", "Leipzig", "Chemnitz", "Zwickau", "Plauen"],
    "bremen": ["Bremen", "Bremerhaven"],
    "schleswig-holstein": ["Kiel", "Lubeck", "Flensburg", "Neumunster"],
    "thuringia": ["Erfurt", "Jena", "Gera", "Weimar", "Gotha", "Eisenach"],
    "brandenburg": ["Potsdam", "Cottbus", "Brandenburg an der Havel", "Frankfurt an der Oder"],
    _: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Dusseldorf", "Stuttgart", "Dresden", "Leipzig", "Hanover", "Nuremberg", "Bremen", "Heidelberg", "Freiburg", "Bonn"],
  },
  fr: {
    "ile-de-france": ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Nanterre", "Versailles", "Creteil", "Colombes", "Courbevoie", "Vincennes", "Saint-Germain-en-Laye"],
    "provence-alpes-cote d'azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Cannes", "Antibes", "Arles", "Saint-Tropez", "Grasse", "Menton"],
    "auvergne-rhone-alpes": ["Lyon", "Grenoble", "Saint-Etienne", "Clermont-Ferrand", "Annecy", "Valence", "Chambery", "Chamonix"],
    "occitanie": ["Toulouse", "Montpellier", "Nimes", "Perpignan", "Beziers", "Carcassonne", "Albi", "Tarbes"],
    "nouvelle-aquitaine": ["Bordeaux", "Limoges", "Poitiers", "La Rochelle", "Pau", "Bayonne", "Biarritz", "Angouleme"],
    "hauts-de-france": ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkirk", "Calais", "Beauvais"],
    "grand est": ["Strasbourg", "Reims", "Metz", "Mulhouse", "Nancy", "Colmar", "Troyes"],
    "brittany": ["Rennes", "Brest", "Saint-Malo", "Quimper", "Lorient", "Vannes", "Dinard"],
    "normandy": ["Rouen", "Le Havre", "Caen", "Dieppe", "Honfleur", "Deauville", "Bayeux", "Mont-Saint-Michel"],
    "pays de la loire": ["Nantes", "Angers", "Le Mans", "Saint-Nazaire", "La Baule"],
    _: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux", "Lille", "Montpellier", "Rennes", "Reims", "Grenoble", "Dijon", "Cannes"],
  },
  jp: {
    "tokyo": ["Shinjuku", "Shibuya", "Ginza", "Roppongi", "Akihabara", "Harajuku", "Asakusa", "Ikebukuro", "Ueno", "Odaiba", "Shimokitazawa", "Nakano", "Kichijoji"],
    "osaka": ["Osaka", "Namba", "Umeda", "Shinsaibashi", "Tennoji", "Sakai", "Toyonaka", "Suita", "Takatsuki"],
    "kanagawa": ["Yokohama", "Kawasaki", "Kamakura", "Fujisawa", "Yokosuka", "Hakone"],
    "aichi": ["Nagoya", "Toyota", "Okazaki", "Ichinomiya", "Kasugai"],
    "hokkaido": ["Sapporo", "Asahikawa", "Hakodate", "Kushiro", "Obihiro", "Otaru", "Furano", "Niseko"],
    "hyogo": ["Kobe", "Himeji", "Nishinomiya", "Amagasaki", "Akashi"],
    "fukuoka": ["Fukuoka", "Kitakyushu", "Kurume", "Oomuta"],
    "kyoto": ["Kyoto", "Uji", "Arashiyama", "Fushimi"],
    "okinawa": ["Naha", "Okinawa City", "Ginowan", "Chatan"],
    "nara": ["Nara", "Kashihara", "Ikoma"],
    _: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Kobe", "Kyoto", "Fukuoka", "Kawasaki", "Hiroshima", "Sendai", "Kitakyushu", "Nara", "Kamakura", "Nikko"],
  },
  br: {
    "sao paulo": ["Sao Paulo", "Campinas", "Santos", "Guarulhos", "Osasco", "Sorocaba", "Ribeirao Preto", "Sao Jose dos Campos", "Piracicaba"],
    "rio de janeiro": ["Rio de Janeiro", "Niteroi", "Petropolis", "Nova Iguacu", "Duque de Caxias", "Buzios", "Cabo Frio", "Paraty"],
    "minas gerais": ["Belo Horizonte", "Uberlandia", "Juiz de Fora", "Contagem", "Betim", "Ouro Preto"],
    "bahia": ["Salvador", "Feira de Santana", "Vitoria da Conquista", "Ilheus", "Porto Seguro"],
    "parana": ["Curitiba", "Londrina", "Maringa", "Foz do Iguacu", "Ponta Grossa", "Cascavel"],
    "rio grande do sul": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Gramado", "Santa Maria"],
    "distrito federal": ["Brasilia", "Taguatinga", "Ceilandia"],
    _: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Belo Horizonte", "Fortaleza", "Curitiba", "Manaus", "Recife", "Porto Alegre"],
  },
  mx: {
    "mexico city": ["Mexico City", "Coyoacan", "Polanco", "Roma Norte", "Condesa", "Xochimilco", "Chapultepec"],
    "jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Puerto Vallarta", "Tonala", "Tequila"],
    "nuevo leon": ["Monterrey", "San Pedro Garza Garcia", "Guadalupe", "Apodaca", "San Nicolas"],
    "quintana roo": ["Cancun", "Playa del Carmen", "Tulum", "Cozumel", "Chetumal"],
    "yucatan": ["Merida", "Valladolid", "Progreso", "Izamal"],
    "baja california": ["Tijuana", "Mexicali", "Ensenada", "Rosarito", "Tecate"],
    _: ["Mexico City", "Guadalajara", "Monterrey", "Cancun", "Puebla", "Tijuana", "Merida", "Leon", "Queretaro", "Oaxaca", "San Miguel de Allende", "Playa del Carmen"],
  },
  kr: {
    "seoul": ["Gangnam", "Hongdae", "Myeongdong", "Itaewon", "Insadong", "Jongno", "Yeouido", "Apgujeong", "Bukchon"],
    "busan": ["Busan", "Haeundae", "Gamcheon", "Seomyeon", "Gwangalli"],
    "incheon": ["Incheon", "Songdo", "Bupyeong"],
    "gyeonggi": ["Suwon", "Seongnam", "Goyang", "Yongin", "Bucheon", "Anyang", "Ansan", "Paju", "Gimpo", "Hwaseong", "Icheon"],
    "jeju": ["Jeju City", "Seogwipo"],
    _: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan", "Jeonju", "Jeju City", "Gyeongju"],
  },
  it: {
    "lombardy": ["Milan", "Bergamo", "Brescia", "Como", "Monza", "Pavia", "Varese", "Mantua", "Cremona"],
    "lazio": ["Rome", "Viterbo", "Latina", "Frosinone", "Rieti", "Tivoli"],
    "tuscany": ["Florence", "Pisa", "Siena", "Lucca", "Arezzo", "Livorno", "Grosseto", "Cortona", "San Gimignano", "Montepulciano", "Volterra"],
    "veneto": ["Venice", "Verona", "Padua", "Vicenza", "Treviso", "Rovigo", "Belluno", "Murano", "Burano"],
    "campania": ["Naples", "Salerno", "Caserta", "Sorrento", "Amalfi", "Positano", "Pompeii", "Capri", "Ischia"],
    "sicily": ["Palermo", "Catania", "Messina", "Syracuse", "Ragusa", "Taormina", "Agrigento", "Trapani", "Cefalu"],
    "emilia-romagna": ["Bologna", "Parma", "Modena", "Reggio Emilia", "Rimini", "Ferrara", "Ravenna", "Cesena"],
    "piedmont": ["Turin", "Novara", "Asti", "Alessandria", "Alba", "Cuneo"],
    "puglia": ["Bari", "Lecce", "Taranto", "Foggia", "Brindisi", "Alberobello", "Polignano a Mare", "Ostuni"],
    "liguria": ["Genoa", "La Spezia", "Sanremo", "Portofino", "Cinque Terre", "Savona"],
    "sardinia": ["Cagliari", "Sassari", "Olbia", "Alghero", "Nuoro"],
    _: ["Rome", "Milan", "Venice", "Florence", "Naples", "Turin", "Bologna", "Genoa", "Palermo", "Verona", "Pisa", "Siena", "Amalfi", "Capri"],
  },
  es: {
    "catalonia": ["Barcelona", "Girona", "Tarragona", "Lleida", "Sitges", "Figueres", "Cadaques"],
    "madrid": ["Madrid", "Alcala de Henares", "Getafe", "Leganes", "Mostoles", "Fuenlabrada", "Alcorcon"],
    "andalusia": ["Seville", "Malaga", "Granada", "Cordoba", "Cadiz", "Marbella", "Ronda", "Jerez", "Almeria", "Huelva", "Jaen", "Nerja"],
    "valencia": ["Valencia", "Alicante", "Elche", "Benidorm", "Castellon", "Gandia"],
    "basque country": ["Bilbao", "San Sebastian", "Vitoria-Gasteiz", "Getxo", "Hondarribia"],
    "balearic islands": ["Palma de Mallorca", "Ibiza", "Menorca", "Formentera", "Soller"],
    "canary islands": ["Las Palmas", "Santa Cruz de Tenerife", "Playa de las Americas", "Puerto de la Cruz", "Maspalomas", "Lanzarote", "Fuerteventura"],
    "galicia": ["Santiago de Compostela", "Vigo", "A Coruna", "Ourense", "Lugo", "Pontevedra"],
    _: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao", "Malaga", "Granada", "San Sebastian", "Ibiza", "Palma de Mallorca"],
  },
  nl: {
    "north holland": ["Amsterdam", "Haarlem", "Zaandam", "Hilversum", "Alkmaar", "Amstelveen"],
    "south holland": ["Rotterdam", "The Hague", "Leiden", "Delft", "Dordrecht", "Gouda", "Scheveningen"],
    "utrecht": ["Utrecht", "Amersfoort", "Veenendaal", "Nieuwegein", "Zeist"],
    "north brabant": ["Eindhoven", "Tilburg", "Breda", "s-Hertogenbosch", "Helmond"],
    "gelderland": ["Arnhem", "Nijmegen", "Apeldoorn", "Ede", "Doetinchem"],
    "overijssel": ["Enschede", "Zwolle", "Deventer", "Hengelo", "Almelo"],
    "limburg": ["Maastricht", "Heerlen", "Venlo", "Roermond", "Sittard"],
    "groningen": ["Groningen"],
    "friesland": ["Leeuwarden"],
    _: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Maastricht", "Leiden", "Haarlem", "Delft", "Breda"],
  },
  ae: {
    "dubai": ["Dubai", "Deira", "Bur Dubai", "Jumeirah", "Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Business Bay", "Al Barsha", "JBR"],
    "abu dhabi": ["Abu Dhabi", "Al Ain", "Yas Island", "Saadiyat Island", "Khalifa City", "Reem Island"],
    "sharjah": ["Sharjah", "Al Nahda", "Al Majaz", "Al Khan"],
    "ajman": ["Ajman"],
    "ras al khaimah": ["Ras Al Khaimah", "Al Hamra"],
    "fujairah": ["Fujairah", "Dibba"],
    _: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Al Ain"],
  },
  sg: {
    "singapore": ["Orchard", "Marina Bay", "Chinatown", "Little India", "Sentosa", "Bugis", "Clarke Quay", "Jurong", "Tampines", "Woodlands", "Changi", "Holland Village", "Tiong Bahru", "Katong", "Dempsey Hill"],
    _: ["Singapore"],
  },
  za: {
    "gauteng": ["Johannesburg", "Pretoria", "Sandton", "Soweto", "Midrand", "Centurion", "Randburg", "Roodepoort"],
    "kwazulu-natal": ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ballito", "Umhlanga"],
    "western cape": ["Cape Town", "Stellenbosch", "Franschhoek", "Paarl", "Knysna", "George", "Hermanus", "Camps Bay", "Muizenberg"],
    "eastern cape": ["Port Elizabeth", "East London", "Mthatha", "Grahamstown"],
    _: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Stellenbosch", "Bloemfontein", "Soweto"],
  },
  ng: {
    "lagos": ["Lagos", "Victoria Island", "Lekki", "Ikeja", "Ikoyi", "Ajah", "Surulere", "Yaba"],
    "abuja": ["Abuja", "Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
    "rivers": ["Port Harcourt"],
    "oyo": ["Ibadan"],
    "kano": ["Kano"],
    "kaduna": ["Kaduna"],
    _: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Kaduna", "Enugu", "Benin City", "Calabar"],
  },
  tr: {
    "istanbul": ["Istanbul", "Beyoglu", "Kadikoy", "Besiktas", "Sisli", "Fatih", "Uskudar", "Bakirkoy", "Taksim", "Sultanahmet"],
    "ankara": ["Ankara", "Cankaya", "Kecioren", "Mamak"],
    "izmir": ["Izmir", "Bornova", "Karsiyaka", "Konak", "Alsancak"],
    "antalya": ["Antalya", "Kemer", "Alanya", "Side", "Kas", "Belek"],
    "mugla": ["Bodrum", "Fethiye", "Marmaris", "Dalaman", "Oludeniz", "Datca"],
    _: ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa", "Bodrum", "Cappadocia", "Fethiye", "Trabzon"],
  },
  sa: {
    "riyadh": ["Riyadh", "Diriyah"],
    "makkah": ["Mecca", "Jeddah", "Taif"],
    "madinah": ["Medina", "Yanbu"],
    "eastern province": ["Dammam", "Khobar", "Dhahran", "Jubail", "Hofuf"],
    _: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Taif", "Tabuk", "Abha"],
  },
  ph: {
    "metro manila": ["Manila", "Quezon City", "Makati", "Taguig", "Pasig", "Mandaluyong", "Pasay", "Paranaque", "Las Pinas", "Marikina", "Alabang", "BGC"],
    "cebu": ["Cebu City", "Mandaue", "Lapu-Lapu", "Mactan"],
    "davao": ["Davao City"],
    _: ["Manila", "Cebu City", "Davao City", "Quezon City", "Makati", "Baguio", "Boracay", "Palawan", "Siargao", "Tagaytay"],
  },
  id: {
    "jakarta": ["Jakarta", "South Jakarta", "Central Jakarta", "North Jakarta", "West Jakarta", "East Jakarta"],
    "bali": ["Denpasar", "Ubud", "Kuta", "Seminyak", "Canggu", "Sanur", "Nusa Dua", "Uluwatu", "Jimbaran", "Lovina"],
    "west java": ["Bandung", "Bekasi", "Depok", "Bogor", "Cimahi", "Tasikmalaya"],
    "east java": ["Surabaya", "Malang", "Batu", "Probolinggo"],
    "yogyakarta": ["Yogyakarta"],
    _: ["Jakarta", "Bali", "Bandung", "Surabaya", "Yogyakarta", "Medan", "Semarang", "Makassar", "Ubud", "Lombok"],
  },
};

// Check if a country has static data
export function hasStaticData(countryCode: string): boolean {
  return countryCode.toLowerCase() in STATES;
}

// Search states/provinces for a country
export function searchStates(countryCode: string, query: string): GeoRegion[] {
  const states = STATES[countryCode.toLowerCase()];
  if (!states) return [];
  if (!query.trim()) return states;
  const q = query.toLowerCase().trim();
  return states.filter(
    (s) => s.name.toLowerCase().includes(q) || (s.abbr && s.abbr.toLowerCase() === q)
  );
}

// Search cities for a country, optionally within a state
export function searchCities(countryCode: string, query: string, stateName?: string): { city: string; region: string }[] {
  const cc = countryCode.toLowerCase();
  const countryCities = CITIES[cc];
  if (!countryCities) return [];

  const q = query.toLowerCase().trim();
  const results: { city: string; region: string }[] = [];

  // Determine which regions to search
  let regions: string[];
  if (stateName) {
    const sLower = stateName.toLowerCase();
    regions = Object.keys(countryCities).filter((k) => k === sLower || k === "_");
  } else {
    regions = Object.keys(countryCities);
  }

  for (const region of regions) {
    const cities = countryCities[region];
    if (!cities) continue;
    const displayRegion = region === "_" ? "" : region;
    for (const city of cities) {
      if (!q || city.toLowerCase().includes(q)) {
        results.push({ city, region: displayRegion });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const key = r.city.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: prefix matches first
  if (q) {
    unique.sort((a, b) => {
      const aStart = a.city.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.city.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return a.city.localeCompare(b.city);
    });
  }

  return unique.slice(0, 12);
}
