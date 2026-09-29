import {
  strawberryEvent,
  cloverEvent,
  derivedEvidence,
} from "./workflow/presentation";
import { strawberryNotice } from "./workflow/notice-replay";
import type {
  ChangeEvent,
  DemoState,
  DraftNotice,
  EvidenceItem,
  Project,
} from "./types";

export const projects: Project[] = [
  {
    id: "strawberry-fields",
    name: "Strawberry Fields",
    subtitle: "Fleet Depot Expansion",
    code: "BBI-2401",
    color: "rose",
    initials: "SF",
    region: "Northeast",
    manager: "Jordan Lee",
    nextDeadline: strawberryEvent.contract?.deadline,
    noticeHours: strawberryEvent.noticeHours,
    pendingExposure: 0,
  },
  {
    id: "blueberry-hill",
    name: "Blueberry Hill",
    subtitle: "Retail Charging Plaza",
    code: "BBI-2408",
    color: "blue",
    initials: "BH",
    region: "Northeast",
    manager: "Jordan Lee",
    nextDeadline: "Tomorrow, 11:43 PM",
    noticeHours: 31,
    pendingExposure: 6630,
  },
  {
    id: "honeybee-yard",
    name: "Honeybee Yard",
    subtitle: "Distribution Center",
    code: "BBI-2412",
    color: "amber",
    initials: "HY",
    region: "Mid-Atlantic",
    manager: "Jordan Lee",
    nextDeadline: "Tomorrow, 1:43 AM",
    noticeHours: 9,
    pendingExposure: 0,
  },
  {
    id: "clover-court",
    name: "Clover Court",
    subtitle: "Apartment Garage",
    code: "BBI-2415",
    color: "green",
    initials: "CC",
    region: "Mid-Atlantic",
    manager: "Alex Morgan",
    pendingExposure: 0,
  },
  {
    id: "moonbeam-garage",
    name: "Moonbeam Garage",
    subtitle: "Municipal Parking Facility",
    code: "BBI-2419",
    color: "purple",
    initials: "MG",
    region: "Northeast",
    manager: "Alex Morgan",
    pendingExposure: 0,
  },
];

const strawberryId = "strawberry-fields-transformer-relocation";
const blueberryId = "blueberry-hill-rock-excavation";
const honeybeeId = "honeybee-yard-added-bollards";
const moonbeamId = "moonbeam-garage-charger-revision";

export const events: ChangeEvent[] = [
  strawberryEvent,
  {
    id: blueberryId,
    projectId: "blueberry-hill",
    title: "Unexpected rock excavation",
    priority: "high",
    exposure: 26800,
    noticeHours: 31,
    status: "review",
    confidence: "High confidence",
    description:
      "Crew encountered subsurface rock not shown in geotechnical documents, changing equipment needs and slowing excavation.",
    summary:
      "The excavation crew encountered a continuous rock layer along the planned utility trench. The geotechnical report did not identify rock at this depth. Field photos and the daily log document the differing site condition and the need for a hydraulic breaker.",
    evidenceIds: ["bh-log", "bh-photos", "bh-report"],
    contract: {
      clause: "§8.2",
      title: "Differing Site Conditions",
      noticeRequired: true,
      deadline: "Sept 30, 11:43 PM",
      excerpt:
        "The Contractor shall promptly notify the Owner in writing of concealed physical conditions that differ materially from those indicated in the Contract Documents, and before such conditions are disturbed.",
    },
    costs: [
      {
        label: "Rock removal",
        amount: 14200,
        detail: "Additional excavation scope",
      },
      {
        label: "Crew labor",
        amount: 6900,
        detail: "Extended excavation hours",
      },
      {
        label: "Breaker rental",
        amount: 3200,
        detail: "Specialized equipment",
      },
      { label: "Contract markup", amount: 2500, detail: "Overhead & profit" },
    ],
    recommendation:
      "Document the differing site condition and issue notice before further excavation disturbs the affected area.",
  },
  {
    id: honeybeeId,
    projectId: "honeybee-yard",
    title: "Added bollards requested onsite",
    priority: "medium",
    exposure: 8650,
    noticeHours: 9,
    status: "ready",
    confidence: "High confidence",
    description:
      "Owner representative requested six additional protective bollards during a site walk.",
    summary:
      "During the Sept 28 site walk, the owner representative requested six additional protective bollards at the loading dock. Meeting notes and a follow-up email confirm the direction. The field team has priced the additional installation.",
    evidenceIds: ["hy-log", "hy-notes", "hy-email"],
    contract: {
      clause: "§12.4",
      title: "Change Notification",
      noticeRequired: true,
      deadline: "Sept 30, 1:43 AM",
      excerpt:
        "Written notice of owner-directed work outside the original scope shall be provided within forty-eight (48) hours of direction, including a preliminary estimate of cost and schedule impact.",
    },
    costs: [
      {
        label: "Six protective bollards",
        amount: 4200,
        detail: "6 units × $700",
      },
      {
        label: "Installation & concrete",
        amount: 3200,
        detail: "Footings and crew labor",
      },
      { label: "Contract markup", amount: 1250, detail: "Overhead & profit" },
    ],
    recommendation:
      "The supporting evidence is complete. Review the prepared notice and send it to the owner representative.",
  },
  cloverEvent,
  {
    id: moonbeamId,
    projectId: "moonbeam-garage",
    title: "Charger count revision",
    priority: "low",
    exposure: -6200,
    status: "no-action",
    confidence: "Medium confidence",
    description:
      "A drawing revision reduced charger count from 42 to 40. Existing procurement quantity has not changed.",
    summary:
      "Drawing Rev F reduces the charger count from 42 to 40. The purchase order still includes 42 chargers. A potential $6,200 credit has been identified, subject to confirmation of return terms and the revised procurement quantity.",
    evidenceIds: ["mg-drawing", "mg-order"],
    costs: [
      {
        label: "Two omitted chargers",
        amount: -6200,
        detail: "2 units × $3,100; subject to procurement review",
      },
    ],
    recommendation:
      "Confirm the revised charger count with procurement and check cancellation terms before recognizing the potential credit. No contractual notice is currently indicated.",
  },
];

export const evidence: EvidenceItem[] = [
  ...derivedEvidence,
  {
    id: "bh-log",
    eventId: blueberryId,
    kind: "log",
    label: "Daily log",
    title: "Unexpected rock logged",
    time: "09:20",
    date: "Sept 28, 2026",
    summary: "Continuous rock encountered at utility trench depth.",
    content:
      "Crew encountered rock at approximately 4 ft below grade along the utility trench. Standard excavator unable to maintain production. Hydraulic breaker requested. Quantities and delay hours are being tracked.",
    author: "Sam Wilson · Superintendent",
  },
  {
    id: "bh-photos",
    eventId: blueberryId,
    kind: "photo",
    label: "4 photos",
    title: "Site photo register added",
    time: "09:45",
    date: "Sept 28, 2026",
    summary: "Four field images referenced in the daily report.",
    content:
      "Photo register (demo; original images not attached)\n\n01 — Exposed rock layer in north trench\n02 — Rock depth measurement at station 2+40\n03 — Excavator bucket against continuous rock\n04 — Overview of affected excavation area",
    author: "Sam Wilson · Superintendent",
  },
  {
    id: "bh-report",
    eventId: blueberryId,
    kind: "report",
    label: "Geotech report",
    title: "Geotechnical report referenced",
    time: "11:10",
    date: "Sept 28, 2026",
    summary: "No rock indicated at the affected depth.",
    content:
      "Geotechnical investigation · Boring B-03\n\nSoil profile indicates granular fill and sandy clay to 8 ft below grade. No bedrock or refusal recorded at the planned utility trench depth. Field conditions require further review by the geotechnical engineer.",
    author: "Northstar Geotechnical · Report excerpt",
  },
  {
    id: "hy-log",
    eventId: honeybeeId,
    kind: "log",
    label: "Daily log",
    title: "Owner request recorded",
    time: "01:43",
    date: "Sept 28, 2026",
    summary: "Six additional bollards requested.",
    content:
      "Owner representative requested six protective bollards at the loading dock during the overnight site walk. Work is outside the issued installation plan. Pricing prepared for PM review.",
    author: "Pat Casey · Superintendent",
  },
  {
    id: "hy-notes",
    eventId: honeybeeId,
    kind: "notes",
    label: "Meeting notes",
    title: "Site walk notes filed",
    time: "08:30",
    date: "Sept 28, 2026",
    summary: "Additional loading dock protection confirmed.",
    content:
      "Action item 4: Bob Builder to provide six additional protective bollards at the loading dock. Owner representative agreed that this is additional scope. Submit notice and estimate for review.",
    author: "Jordan Lee · Senior project manager",
  },
  {
    id: "hy-email",
    eventId: honeybeeId,
    kind: "email",
    label: "Email confirmation",
    title: "Owner confirmation received",
    time: "10:15",
    date: "Sept 28, 2026",
    summary: "Written owner direction received.",
    content:
      "Jordan, confirming our request for six additional bollards at the loading dock. Please submit the additional cost for review and coordinate the installation with the site team. — Avery Chen",
    author: "Avery Chen · Owner representative",
  },
  {
    id: "mg-drawing",
    eventId: moonbeamId,
    kind: "drawing",
    label: "Drawing Rev F",
    title: "Drawing revision received",
    time: "08:45",
    date: "Sept 28, 2026",
    summary: "Charger count reduced from 42 to 40.",
    content:
      "Electrical plan · Revision F\n\nTwo charging positions removed from the east parking bay. Revised total: 40 chargers. Coordinate remaining circuit assignments with the panel schedule.",
    author: "Taylor Reed · Design coordinator",
  },
  {
    id: "mg-order",
    eventId: moonbeamId,
    kind: "order",
    label: "Purchase order",
    title: "Procurement quantity checked",
    time: "13:30",
    date: "Sept 28, 2026",
    summary: "Purchase order still includes 42 chargers.",
    content:
      "PO-2419-008 · EV charging equipment\n\nQuantity: 42 units\nUnit cost: $3,100\nStatus: Order acknowledged\n\nRevised quantity and cancellation terms have not yet been confirmed with the supplier.",
    author: "Robin Ellis · Procurement lead",
  },
];

export const notices: DraftNotice[] = [
  strawberryNotice,
  ...events
    .filter((event) => event.contract && event.id !== strawberryId)
    .map((event) => {
      const project = projects.find((item) => item.id === event.projectId)!;
      return {
        eventId: event.id,
        recipient:
          event.projectId === "honeybee-yard" ? "Avery Chen" : "Morgan Ellis",
        recipientRole: "Owner representative",
        email:
          event.projectId === "honeybee-yard"
            ? "avery.chen@example.com"
            : "morgan.ellis@example.com",
        subject: `Notice of potential change — ${event.title}`,
        body: `Dear ${event.projectId === "honeybee-yard" ? "Avery" : "Morgan"},\n\nPursuant to ${event.contract!.clause} (${event.contract!.title}) of our agreement for ${project.name} — ${project.subtitle}, Bob Builder Infrastructure hereby provides written notice of a potential change to the contracted scope of work.\n\n${event.summary}\n\nOur preliminary estimate of additional cost is ${formatMoney(event.exposure)}. This estimate is subject to further substantiation, and any associated schedule impact is under review. Supporting field records, correspondence, and project documents are available for review.\n\nBob Builder Infrastructure reserves all rights under the contract to seek an adjustment to the contract sum and completion date. This notice does not constitute a final accounting of cost or schedule impact, nor a waiver of any contractual rights.\n\nPlease acknowledge receipt of this notice and advise on the next steps for change authorization.\n\nSincerely,\nJordan Lee\nSenior Project Manager\nBob Builder Infrastructure`,
      };
    }),
];

export function formatMoney(value: number) {
  return `${value < 0 ? "−" : ""}$${Math.abs(value).toLocaleString("en-US")}`;
}
export function getProject(id: string) {
  return projects.find((project) => project.id === id)!;
}
export function getEventEvidence(event: ChangeEvent) {
  return evidence.filter((item) => event.evidenceIds.includes(item.id));
}
export function getExposure(projectId?: string, state: DemoState = {}) {
  // Giving notice preserves recovery rights; it does not mean the cost has been recovered.
  return (
    events
      .filter(
        (event) =>
          (!projectId || event.projectId === projectId) &&
          state[event.id]?.status !== "dismissed",
      )
      .reduce((total, event) => total + Math.max(0, event.exposure), 0) +
    projects
      .filter((project) => !projectId || project.id === projectId)
      .reduce((total, project) => total + project.pendingExposure, 0)
  );
}
