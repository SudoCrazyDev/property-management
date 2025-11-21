// US States, Counties, and Cities data structure
export const LOCATIONS = {
  "NY": {
    name: "New York",
    counties: {
      "New York County": {
        cities: ["New York", "Manhattan"]
      },
      "Kings County": {
        cities: ["Brooklyn"]
      },
      "Queens County": {
        cities: ["Queens", "Flushing", "Astoria"]
      },
      "Bronx County": {
        cities: ["Bronx"]
      },
      "Richmond County": {
        cities: ["Staten Island"]
      },
      "Nassau County": {
        cities: ["Hempstead", "Long Beach", "Garden City"]
      },
      "Suffolk County": {
        cities: ["Huntington", "Islip", "Brookhaven"]
      }
    }
  },
  "CA": {
    name: "California",
    counties: {
      "Los Angeles County": {
        cities: ["Los Angeles", "Beverly Hills", "Santa Monica", "Pasadena", "Long Beach"]
      },
      "San Francisco County": {
        cities: ["San Francisco"]
      },
      "San Diego County": {
        cities: ["San Diego", "Carlsbad", "Oceanside", "Chula Vista"]
      },
      "Orange County": {
        cities: ["Anaheim", "Santa Ana", "Irvine", "Huntington Beach"]
      },
      "Santa Clara County": {
        cities: ["San Jose", "Palo Alto", "Mountain View", "Sunnyvale"]
      },
      "Alameda County": {
        cities: ["Oakland", "Berkeley", "Fremont", "Hayward"]
      }
    }
  },
  "TX": {
    name: "Texas",
    counties: {
      "Harris County": {
        cities: ["Houston", "Pasadena", "Baytown"]
      },
      "Dallas County": {
        cities: ["Dallas", "Irving", "Garland", "Mesquite"]
      },
      "Tarrant County": {
        cities: ["Fort Worth", "Arlington"]
      },
      "Bexar County": {
        cities: ["San Antonio", "Alamo Heights"]
      },
      "Travis County": {
        cities: ["Austin", "Round Rock"]
      }
    }
  },
  "FL": {
    name: "Florida",
    counties: {
      "Miami-Dade County": {
        cities: ["Miami", "Miami Beach", "Coral Gables", "Hialeah"]
      },
      "Broward County": {
        cities: ["Fort Lauderdale", "Hollywood", "Pompano Beach"]
      },
      "Orange County": {
        cities: ["Orlando", "Winter Park", "Kissimmee"]
      },
      "Hillsborough County": {
        cities: ["Tampa", "Plant City"]
      },
      "Pinellas County": {
        cities: ["St. Petersburg", "Clearwater"]
      }
    }
  },
  "IL": {
    name: "Illinois",
    counties: {
      "Cook County": {
        cities: ["Chicago", "Evanston", "Oak Park", "Schaumburg"]
      },
      "DuPage County": {
        cities: ["Naperville", "Aurora", "Wheaton"]
      },
      "Lake County": {
        cities: ["Waukegan", "North Chicago"]
      }
    }
  },
  "PA": {
    name: "Pennsylvania",
    counties: {
      "Philadelphia County": {
        cities: ["Philadelphia"]
      },
      "Allegheny County": {
        cities: ["Pittsburgh", "McKeesport"]
      },
      "Montgomery County": {
        cities: ["Norristown", "King of Prussia"]
      }
    }
  },
  "AZ": {
    name: "Arizona",
    counties: {
      "Maricopa County": {
        cities: ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler"]
      },
      "Pima County": {
        cities: ["Tucson", "Oro Valley"]
      }
    }
  },
  "WA": {
    name: "Washington",
    counties: {
      "King County": {
        cities: ["Seattle", "Bellevue", "Redmond", "Kent"]
      },
      "Pierce County": {
        cities: ["Tacoma", "Puyallup"]
      },
      "Spokane County": {
        cities: ["Spokane"]
      }
    }
  },
  "MA": {
    name: "Massachusetts",
    counties: {
      "Suffolk County": {
        cities: ["Boston", "Chelsea", "Revere"]
      },
      "Middlesex County": {
        cities: ["Cambridge", "Lowell", "Newton"]
      },
      "Worcester County": {
        cities: ["Worcester", "Fitchburg"]
      }
    }
  },
  "GA": {
    name: "Georgia",
    counties: {
      "Fulton County": {
        cities: ["Atlanta", "Sandy Springs", "Roswell"]
      },
      "DeKalb County": {
        cities: ["Decatur", "Dunwoody"]
      },
      "Cobb County": {
        cities: ["Marietta", "Smyrna"]
      }
    }
  }
}

export const STATES = Object.keys(LOCATIONS).map(code => ({
  code,
  name: LOCATIONS[code].name
}))

export const getCountiesForState = (stateCode) => {
  if (!stateCode || !LOCATIONS[stateCode]) return []
  return Object.keys(LOCATIONS[stateCode].counties)
}

export const getCitiesForCounty = (stateCode, countyName) => {
  if (!stateCode || !countyName || !LOCATIONS[stateCode]?.counties[countyName]) return []
  return LOCATIONS[stateCode].counties[countyName].cities
}

