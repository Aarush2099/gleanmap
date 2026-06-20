export type Theme =
  | "Energy" | "Water" | "Food" | "Waste" | "Transportation"
  | "Air & Climate" | "Biodiversity" | "Environmental Justice"
  | "Consumption" | "Wellness" | "Action" | "Leadership";

export interface Challenge {
  day: number;
  title: string;
  theme: Theme;
  blurb: string;
  research: string; // October "Think" data prompt
  action: string;   // November action prompt
}

const themes: Theme[] = [
  "Energy","Water","Food","Waste","Transportation","Air & Climate",
  "Biodiversity","Environmental Justice","Consumption","Wellness","Action","Leadership"
];

const titles: Record<Theme, string[]> = {
  "Energy": ["Power Down","Grid Audit","Solar Story","Phantom Loads","Campus kWh"],
  "Water": ["Watershed Map","Drip Detective","Bottle Boycott","Greywater 101","Source to Tap"],
  "Food": ["Plant-Forward","Food Miles","Cafeteria Audit","Compost Census","Local Harvest"],
  "Waste": ["Trash Audit","Recycling Reality","Refill Revolution","E-Waste Drive","Zero Packaging"],
  "Transportation": ["Bike It","Carbon Commute","Transit Tally","EV Future","Walkability Map"],
  "Air & Climate": ["AQI Watch","Carbon Footprint","Heat Island","Methane Map","Climate Letter"],
  "Biodiversity": ["Pollinator Patch","Native Species","Tree Inventory","Wildlife Corridor","Seed Save"],
  "Environmental Justice": ["Frontline Stories","Policy Scan","Equity Audit","Voices Heard","Just Transition"],
  "Consumption": ["Closet Detox","Buy Nothing","Repair Cafe","Slow Fashion","Digital Diet"],
  "Wellness": ["Nature Rx","Mindful Mile","Green Break","Sleep & Light","Forest Bath"],
  "Action": ["Petition Drive","Op-Ed Pitch","Town Hall","Mutual Aid","Coalition Build"],
  "Leadership": ["Pitch Night","Campus Pledge","Mentor Up","Vision Plan","Legacy Project"],
};

export const challenges: Challenge[] = Array.from({ length: 60 }, (_, i) => {
  const day = i + 1;
  const theme = themes[i % themes.length];
  const list = titles[theme];
  const title = list[Math.floor(i / themes.length) % list.length];
  const phase = day <= 30 ? "October — Research" : "November — Action";
  return {
    day,
    title,
    theme,
    blurb: `${phase}: ${theme.toLowerCase()} challenge centered on real, regional impact.`,
    research: `Map ${theme.toLowerCase()} conditions in your region: collect 3 data points, 1 photo, and 1 stakeholder quote.`,
    action: `Run a ${theme.toLowerCase()} intervention on campus this week. Document outcomes with metrics and one short reflection.`,
  };
});

export function getChallenge(day: number) {
  return challenges.find((c) => c.day === day);
}

export const universities = [
  { name: "Harvard University", state: "MA", research: 9920, impact: 8410 },
  { name: "UC Berkeley", state: "CA", research: 9820, impact: 7430 },
  { name: "MIT", state: "MA", research: 9560, impact: 8050 },
  { name: "Yale University", state: "CT", research: 9215, impact: 8120 },
  { name: "University of Michigan", state: "MI", research: 8870, impact: 7980 },
  { name: "Stanford University", state: "CA", research: 8640, impact: 7510 },
  { name: "Arizona State University", state: "AZ", research: 8390, impact: 8245 },
  { name: "University of Vermont", state: "VT", research: 8210, impact: 6890 },
  { name: "Howard University", state: "DC", research: 7980, impact: 7720 },
  { name: "Oberlin College", state: "OH", research: 7720, impact: 7110 },
  { name: "UT Austin", state: "TX", research: 7580, impact: 6940 },
  { name: "Duke University", state: "NC", research: 7340, impact: 7220 },
  { name: "Spelman College", state: "GA", research: 7190, impact: 6810 },
  { name: "University of Washington", state: "WA", research: 7045, impact: 6720 },
  { name: "Santa Monica College", state: "CA", research: 6890, impact: 6520 },
  { name: "Bunker Hill CC", state: "MA", research: 6610, impact: 6310 },
];

export const partners = [
  "Patagonia","Seventh Generation","Ben & Jerry's","Klean Kanteen","Allbirds",
  "Numi Organic Tea","Dr. Bronner's","Aveda","Clif Bar","Stonyfield",
  "Sierra Club","350.org","NRDC","WWF","The Nature Conservancy",
];
