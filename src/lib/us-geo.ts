// Static US states and major cities for instant autocomplete (no API calls)

export interface USState {
  name: string;
  abbr: string;
}

export const US_STATES: USState[] = [
  { name: "Alabama", abbr: "AL" },
  { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" },
  { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" },
  { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" },
  { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" },
  { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" },
  { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" },
  { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" },
  { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" },
  { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" },
  { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" },
  { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" },
  { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" },
  { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" },
  { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" },
  { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" },
  { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" },
  { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" },
  { name: "Wyoming", abbr: "WY" },
  { name: "District of Columbia", abbr: "DC" },
  { name: "Puerto Rico", abbr: "PR" },
  { name: "Guam", abbr: "GU" },
  { name: "U.S. Virgin Islands", abbr: "VI" },
];

// Major US cities grouped by state abbreviation
// ~1500 cities covering all states, sorted by population within each state
export const US_CITIES: Record<string, string[]> = {
  AL: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison", "Florence", "Gadsden", "Vestavia Hills", "Prattville", "Phenix City", "Alabaster", "Bessemer", "Enterprise", "Opelika", "Homewood", "Northport", "Anniston", "Prichard", "Athens"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Wasilla", "Kenai", "Kodiak", "Bethel", "Palmer", "Homer", "Soldotna"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise", "Yuma", "Avondale", "Goodyear", "Flagstaff", "Buckeye", "Lake Havasu City", "Casa Grande", "Maricopa", "Sierra Vista", "Prescott", "Bullhead City", "Apache Junction", "Prescott Valley", "Marana", "El Mirage", "Queen Creek", "Kingman", "San Luis", "Sahuarita", "Fountain Hills", "Oro Valley", "Sedona"],
  AR: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville", "Hot Springs", "Benton", "Texarkana", "Sherwood", "Jacksonville", "Russellville", "Bella Vista", "West Memphis", "Paragould", "Cabot", "Searcy", "Van Buren", "Bryant"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista", "Fremont", "San Bernardino", "Modesto", "Moreno Valley", "Fontana", "Glendale", "Huntington Beach", "Santa Clarita", "Garden Grove", "Oceanside", "Rancho Cucamonga", "Ontario", "Santa Rosa", "Elk Grove", "Corona", "Lancaster", "Palmdale", "Salinas", "Pomona", "Hayward", "Escondido", "Sunnyvale", "Torrance", "Pasadena", "Orange", "Fullerton", "Thousand Oaks", "Roseville", "Concord", "Simi Valley", "Santa Clara", "Victorville", "Vallejo", "Berkeley", "El Monte", "Downey", "Costa Mesa", "Inglewood", "Carlsbad", "San Buenaventura", "Fairfield", "West Covina", "Murrieta", "Richmond", "Norwalk", "Antioch", "Temecula", "Burbank", "Daly City", "El Cajon", "San Mateo", "Rialto", "Clovis", "Compton", "Jurupa Valley", "Vista", "South Gate", "Mission Viejo", "Vacaville", "Carson", "Hesperia", "Santa Maria", "Redding", "Westminster", "Santa Monica", "Chico", "Newport Beach", "San Leandro", "San Marcos", "Whittier", "Hawthorne", "Citrus Heights", "Alhambra", "Tracy", "Livermore", "Buena Park", "Menifee", "Hemet", "Lakewood", "Merced", "Chino", "Indio", "Redwood City", "Lake Forest", "Napa", "Tustin", "Bellflower", "Mountain View", "Chino Hills", "Baldwin Park", "Alameda", "Upland", "San Ramon", "Folsom", "Pleasanton", "Lynwood", "Union City", "Apple Valley", "Redlands", "Turlock", "Perris", "Manteca", "Milpitas", "Lodi", "Cupertino", "Palo Alto", "Davis", "Walnut Creek", "Encinitas", "La Mesa", "Petaluma", "San Clemente"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial", "Boulder", "Greeley", "Longmont", "Loveland", "Broomfield", "Castle Rock", "Commerce City", "Parker", "Littleton", "Northglenn", "Brighton", "Englewood", "Wheat Ridge", "Golden", "Lafayette", "Erie", "Evans", "Louisville", "Manitou Springs", "Steamboat Springs", "Durango", "Aspen", "Vail", "Telluride", "Estes Park", "Grand Junction"],
  CT: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden", "Milford", "West Haven", "Middletown", "Norwich", "Shelton", "Torrington", "New London", "Ansonia", "Derby", "Groton", "Greenwich", "Fairfield", "Westport", "Glastonbury", "Simsbury", "Farmington"],
  DE: ["Wilmington", "Dover", "Newark", "Middletown", "Bear", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle", "Lewes", "Rehoboth Beach"],
  FL: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral", "Pembroke Pines", "Hollywood", "Miramar", "Gainesville", "Coral Springs", "Miami Gardens", "Clearwater", "Palm Bay", "Pompano Beach", "West Palm Beach", "Lakeland", "Davie", "Miami Beach", "Sunrise", "Boca Raton", "Deltona", "Plantation", "Largo", "Deerfield Beach", "Palm Coast", "Melbourne", "Boynton Beach", "Lauderhill", "Weston", "Kissimmee", "Homestead", "Delray Beach", "Tamarac", "Daytona Beach", "North Miami", "Wellington", "North Port", "Jupiter", "Ocala", "Port Orange", "Margate", "Coconut Creek", "Sanford", "Sarasota", "Pensacola", "Bradenton", "Naples", "Key West", "Fort Myers", "Panama City", "St. Augustine"],
  GA: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "South Fulton", "Roswell", "Johns Creek", "Albany", "Warner Robins", "Alpharetta", "Marietta", "Valdosta", "Smyrna", "Dunwoody", "Brookhaven", "Peachtree City", "Newnan", "Dalton", "Gainesville", "Milton", "Hinesville", "Douglasville", "Kennesaw", "Lawrenceville", "Statesboro", "Woodstock", "Canton", "Stockbridge", "Carrollton", "Griffin", "McDonough", "Acworth", "Pooler", "Rome"],
  HI: ["Honolulu", "East Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu", "Kaneohe", "Mililani Town", "Kahului", "Ewa Gentry", "Kihei", "Lahaina"],
  ID: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Caldwell", "Pocatello", "Coeur d'Alene", "Twin Falls", "Post Falls", "Lewiston", "Eagle", "Kuna", "Moscow", "Rexburg", "Sun Valley", "Sandpoint"],
  IL: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield", "Elgin", "Peoria", "Champaign", "Waukegan", "Cicero", "Bloomington", "Arlington Heights", "Evanston", "Decatur", "Schaumburg", "Bolingbrook", "Palatine", "Skokie", "Des Plaines", "Orland Park", "Tinley Park", "Oak Lawn", "Berwyn", "Mount Prospect", "Normal", "Wheaton", "Hoffman Estates", "Oak Park", "Downers Grove", "Elmhurst", "Glenview", "DeKalb", "Lombard", "Moline", "Buffalo Grove", "Bartlett", "Urbana", "Quincy", "Crystal Lake", "Plainfield", "Streamwood", "Carol Stream", "Romeoville", "Rock Island", "Hanover Park", "Carpentersville", "Wheeling", "Park Ridge", "Addison", "Calumet City"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Lafayette", "Muncie", "Terre Haute", "Kokomo", "Anderson", "Noblesville", "Greenwood", "Elkhart", "Mishawaka", "Lawrence", "Jeffersonville", "Columbus", "Portage", "New Albany", "Richmond", "Westfield", "Valparaiso", "Goshen", "Michigan City", "West Lafayette", "Marion", "Crown Point", "Plainfield", "Franklin", "Zionsville"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Ames", "West Des Moines", "Council Bluffs", "Ankeny", "Dubuque", "Urbandale", "Cedar Falls", "Marion", "Bettendorf", "Mason City", "Marshalltown", "Clinton", "Burlington", "Ottumwa", "Fort Dodge", "Muscatine", "Coralville", "Johnston", "North Liberty", "Waukee"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina", "Hutchinson", "Leavenworth", "Leawood", "Garden City", "Emporia", "Derby", "Dodge City", "Prairie Village", "Junction City", "Hays"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown", "Florence", "Hopkinsville", "Nicholasville", "Elizabethtown", "Henderson", "Frankfort", "Independence", "Jeffersontown", "Paducah", "Radcliff", "Ashland", "Madisonville", "Murray", "Erlanger"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Metairie", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma", "Marrero", "New Iberia", "Laplace", "Slidell", "Prairieville", "Central", "Ruston", "Sulphur", "Hammond", "Harvey", "Bayou Cane", "Natchitoches"],
  ME: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Saco", "Augusta", "Westbrook", "Waterville", "Presque Isle", "Brunswick", "Bar Harbor", "Kennebunk", "Scarborough", "Kittery"],
  MD: ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Waldorf", "Glen Burnie", "Ellicott City", "Frederick", "Dundalk", "Rockville", "Bethesda", "Gaithersburg", "Towson", "Bowie", "Aspen Hill", "Wheaton", "Bel Air", "College Park", "Annapolis", "Hagerstown", "Severn", "Odenton", "Clinton", "Catonsville", "Salisbury", "Laurel", "Severna Park", "Olney", "Potomac", "Owings Mills", "Pikesville", "Cumberland"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "New Bedford", "Quincy", "Lynn", "Fall River", "Newton", "Lawrence", "Somerville", "Framingham", "Haverhill", "Waltham", "Malden", "Brookline", "Plymouth", "Medford", "Taunton", "Chicopee", "Weymouth", "Revere", "Peabody", "Methuen", "Barnstable", "Pittsfield", "Attleboro", "Arlington", "Everett", "Salem", "Westfield", "Leominster", "Fitchburg", "Beverly", "Holyoke", "Marlborough", "Woburn", "Chelsea", "Northampton", "Amherst", "Provincetown", "Nantucket", "Martha's Vineyard"],
  MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn", "Livonia", "Troy", "Westland", "Farmington Hills", "Kalamazoo", "Wyoming", "Southfield", "Rochester Hills", "Taylor", "Pontiac", "St. Clair Shores", "Royal Oak", "Novi", "Dearborn Heights", "Battle Creek", "Saginaw", "Kentwood", "East Lansing", "Roseville", "Portage", "Midland", "Lincoln Park", "Muskegon", "Holland", "Bay City", "Jackson", "Traverse City", "Marquette", "Mackinac Island"],
  MN: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "Maple Grove", "Woodbury", "St. Cloud", "Eagan", "Eden Prairie", "Coon Rapids", "Burnsville", "Blaine", "Lakeville", "Minnetonka", "Apple Valley", "Edina", "St. Louis Park", "Mankato", "Moorhead", "Shakopee", "Maplewood", "Cottage Grove", "Richfield", "Roseville", "Inver Grove Heights", "Savage", "Prior Lake", "Chanhassen", "Owatonna", "Winona", "Chaska", "Hastings"],
  MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Olive Branch", "Greenville", "Horn Lake", "Clinton", "Pearl", "Madison", "Starkville", "Columbus", "Vicksburg", "Pascagoula", "Oxford", "Brandon", "Ridgeland", "Gautier", "Ocean Springs", "Long Beach"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters", "Blue Springs", "Florissant", "Joplin", "Chesterfield", "Jefferson City", "Cape Girardeau", "Wildwood", "University City", "Ballwin", "Raytown", "Liberty", "Wentzville", "Kirkwood", "Maryland Heights", "Hazelwood", "Gladstone", "Grandview", "Belton", "Webster Groves", "Sedalia", "Branson"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City", "Livingston", "Whitefish", "Big Sky"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "North Platte", "Columbus", "Papillion", "La Vista", "Scottsbluff", "South Sioux City"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City", "Fallon", "Winnemucca", "Laughlin"],
  NH: ["Manchester", "Nashua", "Concord", "Derry", "Dover", "Rochester", "Salem", "Merrimack", "Hudson", "Londonderry", "Keene", "Bedford", "Portsmouth", "Goffstown", "Laconia", "Hampton", "Exeter", "Hanover"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Lakewood", "Edison", "Woodbridge", "Toms River", "Hamilton", "Trenton", "Clifton", "Camden", "Brick", "Cherry Hill", "Passaic", "Middletown", "Union City", "Old Bridge", "Gloucester", "East Orange", "Bayonne", "Franklin", "North Bergen", "Vineland", "Union", "Piscataway", "New Brunswick", "Jackson", "Wayne", "Irvington", "Parsippany", "Howell", "Perth Amboy", "Hoboken", "Plainfield", "West New York", "Washington", "East Brunswick", "Bloomfield", "West Orange", "Evesham", "Bridgewater", "South Brunswick", "Egg Harbor", "Manchester", "Hackensack", "Sayreville", "Mount Laurel", "Berkeley Heights", "Atlantic City", "Princeton", "Morristown", "Montclair", "Asbury Park", "Cape May", "Red Bank"],
  NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "South Valley", "Clovis", "Hobbs", "Alamogordo", "Carlsbad", "Gallup", "Deming", "Los Lunas", "Chaparral", "Las Vegas", "Sunland Park", "Taos", "Silver City", "Ruidoso"],
  NY: ["New York City", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica", "White Plains", "Hempstead", "Troy", "Niagara Falls", "Binghamton", "Freeport", "Valley Stream", "Long Beach", "Spring Valley", "Rome", "Ithaca", "North Tonawanda", "Poughkeepsie", "Jamestown", "Elmira", "Saratoga Springs", "Newburgh", "Watertown", "Kingston", "Middletown", "Auburn", "Lindenhurst", "Rockville Centre", "Oswego", "Plattsburgh", "Garden City", "Great Neck", "Port Chester", "Tarrytown", "Sleepy Hollow", "Woodstock", "Lake Placid", "Montauk", "Sag Harbor", "Cooperstown"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord", "Greenville", "Asheville", "Gastonia", "Jacksonville", "Chapel Hill", "Huntersville", "Apex", "Burlington", "Kannapolis", "Mooresville", "Rocky Mount", "Holly Springs", "Wilson", "Hickory", "Wake Forest", "Indian Trail", "Cornelius", "Sanford", "Matthews", "Monroe", "New Bern", "Salisbury", "Thomasville", "Leland", "Fuquay-Varina", "Kernersville", "Mint Hill", "Boone", "Outer Banks"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton", "Devils Lake", "Valley City"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls", "Middletown", "Euclid", "Newark", "Mansfield", "Mentor", "Beavercreek", "Cleveland Heights", "Strongsville", "Dublin", "Fairfield", "Findlay", "Warren", "Lancaster", "Lima", "Huber Heights", "Westerville", "Marion", "Grove City", "Reynoldsburg", "Delaware", "Brunswick", "Stow", "Hilliard", "Upper Arlington", "Westlake", "North Olmsted", "Mason", "North Ridgeville", "Bowling Green", "Sandusky", "Athens", "Wooster", "Zanesville", "Medina", "Put-in-Bay"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Lawton", "Moore", "Midwest City", "Enid", "Stillwater", "Muskogee", "Bartlesville", "Owasso", "Shawnee", "Yukon", "Bixby", "Jenks", "Ardmore", "Ponca City", "Duncan"],
  OR: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford", "Springfield", "Corvallis", "Albany", "Tigard", "Lake Oswego", "Keizer", "Grants Pass", "Oregon City", "McMinnville", "Redmond", "Tualatin", "West Linn", "Woodburn", "Forest Grove", "Newberg", "Roseburg", "Klamath Falls", "Ashland", "Milwaukie", "Sherwood", "Happy Valley", "Canby", "Hood River", "Astoria", "Cannon Beach", "Sisters"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie", "Upper Darby", "Scranton", "Bethlehem", "Bensalem", "Lancaster", "Harrisburg", "York", "Wilkes-Barre", "Chester", "Abington", "Cheltenham", "Lower Merion", "Bristol", "Haverford", "Millcreek", "Levittown", "State College", "Norristown", "Easton", "Williamsport", "Carlisle", "Pottstown", "West Chester", "Doylestown", "Stroudsburg", "Chambersburg", "New Hope", "Gettysburg", "Jim Thorpe", "Hershey", "Media", "King of Prussia", "Bryn Mawr", "Ardmore"],
  RI: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "South Kingstown", "West Warwick", "Johnston", "North Kingstown", "Newport", "Bristol", "Middletown", "Narragansett", "Westerly", "Barrington"],
  SC: ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Goose Creek", "Hilton Head Island", "Sumter", "Florence", "Spartanburg", "Myrtle Beach", "Greer", "Aiken", "Anderson", "Mauldin", "North Augusta", "Easley", "Simpsonville", "Hanahan", "Lexington", "Conway", "West Columbia", "Clemson", "Beaufort", "Kiawah Island"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Huron", "Vermillion", "Spearfish", "Pierre", "Sturgis", "Deadwood"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett", "Hendersonville", "Kingsport", "Collierville", "Smyrna", "Cleveland", "Brentwood", "Germantown", "Spring Hill", "Columbia", "La Vergne", "Gallatin", "Cookeville", "Mount Juliet", "Lebanon", "Morristown", "Oak Ridge", "Maryville", "Bristol", "Farragut", "Shelbyville", "Tullahoma", "Pigeon Forge", "Gatlinburg", "Sevierville"],
  TX: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "Grand Prairie", "Brownsville", "McKinney", "Frisco", "Pasadena", "Mesquite", "Killeen", "McAllen", "Midland", "Denton", "Waco", "Carrollton", "Round Rock", "Abilene", "Pearland", "Richardson", "Odessa", "Sugar Land", "Beaumont", "College Station", "Lewisville", "League City", "Tyler", "Allen", "Edinburg", "Wichita Falls", "San Marcos", "Temple", "Flower Mound", "North Richland Hills", "New Braunfels", "Conroe", "Cedar Park", "Mansfield", "Pflugerville", "Georgetown", "Rowlett", "Victoria", "Wylie", "Burleson", "Port Arthur", "Harlingen", "Missouri City", "Baytown", "Pharr", "Galveston", "Katy", "The Woodlands", "Southlake", "Grapevine", "Fredericksburg", "Dripping Springs", "Bastrop", "Marble Falls", "Boerne"],
  UT: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "South Jordan", "Lehi", "Millcreek", "Taylorsville", "Logan", "Murray", "Draper", "Bountiful", "Riverton", "Herriman", "Spanish Fork", "Roy", "Pleasant Grove", "Springville", "Eagle Mountain", "Tooele", "Cedar City", "American Fork", "Cottonwood Heights", "Midvale", "Clearfield", "Kaysville", "Holladay", "Syracuse", "Saratoga Springs", "Park City", "Moab"],
  VT: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Winooski", "St. Albans", "Newport", "Vergennes", "Stowe", "Woodstock", "Manchester", "Brattleboro", "Bennington", "Middlebury"],
  VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk", "Lynchburg", "Harrisonburg", "Leesburg", "Charlottesville", "Danville", "Manassas", "Petersburg", "Fredericksburg", "Winchester", "Salem", "Staunton", "Fairfax", "Herndon", "Hopewell", "Christiansburg", "Blacksburg", "Colonial Heights", "Radford", "Culpeper", "Waynesboro", "Front Royal", "Williamsburg", "Ashburn", "Centreville", "McLean", "Reston", "Tysons", "Falls Church", "Annandale", "Sterling", "Woodbridge", "Dale City", "Lake Ridge", "Burke", "Springfield", "Chantilly", "Gainesville", "Bristow", "Dumfries", "Stafford", "Warrenton", "Purcellville", "Loudoun Valley", "Arlington"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Spokane Valley", "Federal Way", "Yakima", "Kirkland", "Bellingham", "Kennewick", "Auburn", "Pasco", "Marysville", "Lakewood", "Redmond", "Shoreline", "Richland", "Sammamish", "Burien", "Olympia", "Lacey", "Edmonds", "Bremerton", "Puyallup", "Lynnwood", "Bothell", "Longview", "Issaquah", "Wenatchee", "Mount Vernon", "University Place", "Pullman", "Walla Walla", "Des Moines", "SeaTac", "Oak Harbor", "Mercer Island", "Ellensburg", "Moses Lake", "Leavenworth", "Friday Harbor", "Port Townsend", "Anacortes", "Sequim"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Weirton", "Fairmont", "Martinsburg", "Beckley", "Clarksburg", "South Charleston", "St. Albans", "Vienna", "Bluefield", "Lewisburg", "Shepherdstown", "Harpers Ferry"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire", "Oshkosh", "Janesville", "West Allis", "La Crosse", "Sheboygan", "Wauwatosa", "Fond du Lac", "New Berlin", "Wausau", "Brookfield", "Beloit", "Greenfield", "Manitowoc", "West Bend", "Sun Prairie", "Superior", "Stevens Point", "Neenah", "Fitchburg", "Muskego", "Watertown", "De Pere", "Marshfield", "Sturgeon Bay", "Door County", "Lake Geneva", "Baraboo", "Minocqua", "Wisconsin Dells"],
  WY: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson", "Cody", "Rawlins", "Lander", "Powell", "Torrington", "Thermopolis"],
  DC: ["Washington", "Georgetown", "Capitol Hill", "Dupont Circle", "Adams Morgan", "U Street", "Shaw", "Navy Yard", "Foggy Bottom", "Tenleytown", "Brookland", "Anacostia", "Petworth", "Columbia Heights", "Logan Circle", "H Street"],
  PR: ["San Juan", "Bayamon", "Carolina", "Ponce", "Caguas", "Guaynabo", "Mayaguez", "Arecibo", "Aguadilla", "Humacao"],
  GU: ["Hagatna", "Dededo", "Yigo", "Tamuning", "Mangilao"],
  VI: ["Charlotte Amalie", "Christiansted", "Frederiksted", "Cruz Bay"],
};

// Search states — instant client-side filter
export function searchStates(query: string): USState[] {
  if (!query.trim()) return US_STATES;
  const q = query.toLowerCase().trim();
  return US_STATES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.abbr.toLowerCase() === q
  );
}

// Search cities for a given state — instant client-side filter
export function searchCities(query: string, stateAbbr?: string): { city: string; state: string }[] {
  const q = query.toLowerCase().trim();
  const results: { city: string; state: string }[] = [];

  const states = stateAbbr ? [stateAbbr.toUpperCase()] : Object.keys(US_CITIES);

  for (const abbr of states) {
    const cities = US_CITIES[abbr];
    if (!cities) continue;
    for (const city of cities) {
      if (!q || city.toLowerCase().includes(q)) {
        results.push({ city, state: abbr });
      }
    }
  }

  // Sort: exact prefix matches first, then alphabetical
  if (q) {
    results.sort((a, b) => {
      const aStart = a.city.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.city.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
      return a.city.localeCompare(b.city);
    });
  }

  return results.slice(0, 12);
}

// Get state abbreviation from name
export function getStateAbbr(stateName: string): string | undefined {
  const lower = stateName.toLowerCase();
  return US_STATES.find(
    (s) => s.name.toLowerCase() === lower || s.abbr.toLowerCase() === lower
  )?.abbr;
}
