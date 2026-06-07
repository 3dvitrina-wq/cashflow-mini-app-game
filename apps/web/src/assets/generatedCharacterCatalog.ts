import type { Outfit } from '../store/types';

import artistProfile from './generated/characters/artist/portraits/artist_profile_bust.png';
import artistStable from './generated/characters/artist/emotions/artist_stable.png';
import burnoutClerkProfile from './generated/characters/burnout_clerk/portraits/burnout_clerk_profile_bust.png';
import burnoutClerkStable from './generated/characters/burnout_clerk/emotions/burnout_clerk_stable.png';
import campusStudentProfile from './generated/characters/campus_student/portraits/campus_student_profile_bust.png';
import campusStudentStable from './generated/characters/campus_student/emotions/campus_student_stable.png';
import checkoutCashierProfile from './generated/characters/checkout_cashier/portraits/checkout_cashier_profile_bust.png';
import checkoutCashierStable from './generated/characters/checkout_cashier/emotions/checkout_cashier_stable.png';
import classroomTeacherProfile from './generated/characters/classroom_teacher/portraits/classroom_teacher_profile_bust.png';
import classroomTeacherStable from './generated/characters/classroom_teacher/emotions/classroom_teacher_stable.png';
import dealMavenProfile from './generated/characters/deal_maven/portraits/deal_maven_profile_bust.png';
import dealMavenStable from './generated/characters/deal_maven/emotions/deal_maven_stable.png';
import fixerConsultantProfile from './generated/characters/fixer_consultant/portraits/fixer_consultant_profile_bust.png';
import fixerConsultantStable from './generated/characters/fixer_consultant/emotions/fixer_consultant_stable.png';
import flightAttendantProfile from './generated/characters/flight_attendant/portraits/flight_attendant_profile_bust.png';
import flightAttendantStable from './generated/characters/flight_attendant/emotions/flight_attendant_stable.png';
import grandmaCollectorProfile from './generated/characters/grandma_collector/portraits/grandma_collector_profile_bust.png';
import grandmaCollectorStable from './generated/characters/grandma_collector/emotions/grandma_collector_stable.png';
import koreanStudentProfile from './generated/characters/korean_student/portraits/korean_student_profile_bust.png';
import koreanStudentStable from './generated/characters/korean_student/emotions/korean_student_stable.png';
import madFashionProfile from './generated/characters/mad_fashion/portraits/mad_fashion_profile_bust.png';
import madFashionStable from './generated/characters/mad_fashion/emotions/mad_fashion_stable.png';
import policeOfficerProfile from './generated/characters/police_officer/portraits/police_officer_profile_bust.png';
import policeOfficerStable from './generated/characters/police_officer/emotions/police_officer_stable.png';
import rapQueenProfile from './generated/characters/rap_queen/portraits/rap_queen_profile_bust.png';
import rapQueenStable from './generated/characters/rap_queen/emotions/rap_queen_stable.png';
import skyPilotProfile from './generated/characters/sky_pilot/portraits/sky_pilot_profile_bust.png';
import skyPilotStable from './generated/characters/sky_pilot/emotions/sky_pilot_stable.png';
import investorProfile from './generated/characters/investor/turnaround/investor_front.png';
import investorStable from './generated/characters/investor/emotions/investor_stable.png';
import lobbyBurnoutClerk from './generated/lobby/characters/lobby_burnout_clerk.png';
import lobbyCheckoutCashier from './generated/lobby/characters/lobby_checkout_cashier.png';
import lobbyDealMaven from './generated/lobby/characters/lobby_deal_maven.png';
import lobbyGrandmaCollector from './generated/lobby/characters/lobby_grandma_collector.png';
import lobbyKoreanStudent from './generated/lobby/characters/lobby_korean_student.png';
import lobbyMadFashion from './generated/lobby/characters/lobby_mad_fashion.png';
import lobbyRapQueen from './generated/lobby/characters/lobby_rap_queen.png';

export type CharacterId =
  | 'artist'
  | 'burnout_clerk'
  | 'campus_student'
  | 'checkout_cashier'
  | 'classroom_teacher'
  | 'deal_maven'
  | 'fixer_consultant'
  | 'flight_attendant'
  | 'grandma_collector'
  | 'korean_student'
  | 'mad_fashion'
  | 'police_officer'
  | 'rap_queen'
  | 'sky_pilot'
  | 'investor';

export interface GeneratedCharacter {
  id: CharacterId;
  displayName: string;
  displayNameRu: string;
  profile: string;
  stable: string;
  engineOutfit: Outfit;
  starterOwned?: boolean;
  lobbyBg?: string;
}

export const GENERATED_CHARACTERS: GeneratedCharacter[] = [
  {
    id: 'checkout_cashier',
    displayName: 'Checkout Cashier',
    displayNameRu: 'Кассирша',
    profile: checkoutCashierProfile,
    stable: checkoutCashierStable,
    engineOutfit: 'operator',
    starterOwned: true,
    lobbyBg: lobbyCheckoutCashier,
  },
  {
    id: 'deal_maven',
    displayName: 'Deal Maven',
    displayNameRu: 'Переговорщица',
    profile: dealMavenProfile,
    stable: dealMavenStable,
    engineOutfit: 'trader',
    starterOwned: true,
    lobbyBg: lobbyDealMaven,
  },
  {
    id: 'burnout_clerk',
    displayName: 'Burnout Clerk',
    displayNameRu: 'Уставший клерк',
    profile: burnoutClerkProfile,
    stable: burnoutClerkStable,
    engineOutfit: 'office',
    starterOwned: true,
    lobbyBg: lobbyBurnoutClerk,
  },
  {
    id: 'campus_student',
    displayName: 'Campus Student',
    displayNameRu: 'Мажор-студент',
    profile: campusStudentProfile,
    stable: campusStudentStable,
    engineOutfit: 'creator',
    starterOwned: true,
  },
  {
    id: 'sky_pilot',
    displayName: 'Sky Pilot',
    displayNameRu: 'Летчик',
    profile: skyPilotProfile,
    stable: skyPilotStable,
    engineOutfit: 'nomad',
    starterOwned: true,
  },
  {
    id: 'police_officer',
    displayName: 'Police Officer',
    displayNameRu: 'Полицейский',
    profile: policeOfficerProfile,
    stable: policeOfficerStable,
    engineOutfit: 'hustler',
    starterOwned: true,
  },
  {
    id: 'artist',
    displayName: 'Artist',
    displayNameRu: 'Художник',
    profile: artistProfile,
    stable: artistStable,
    engineOutfit: 'creator',
  },
  {
    id: 'classroom_teacher',
    displayName: 'Classroom Teacher',
    displayNameRu: 'Учительница',
    profile: classroomTeacherProfile,
    stable: classroomTeacherStable,
    engineOutfit: 'office',
  },
  {
    id: 'fixer_consultant',
    displayName: 'Fixer Consultant',
    displayNameRu: 'Консультантка',
    profile: fixerConsultantProfile,
    stable: fixerConsultantStable,
    engineOutfit: 'trader',
  },
  {
    id: 'flight_attendant',
    displayName: 'Flight Attendant',
    displayNameRu: 'Стюардесса',
    profile: flightAttendantProfile,
    stable: flightAttendantStable,
    engineOutfit: 'nomad',
  },
  {
    id: 'grandma_collector',
    displayName: 'Grandma Collector',
    displayNameRu: 'Бабка',
    profile: grandmaCollectorProfile,
    stable: grandmaCollectorStable,
    engineOutfit: 'hustler',
    lobbyBg: lobbyGrandmaCollector,
  },
  {
    id: 'korean_student',
    displayName: 'Korean Student',
    displayNameRu: 'Студентка',
    profile: koreanStudentProfile,
    stable: koreanStudentStable,
    engineOutfit: 'creator',
    lobbyBg: lobbyKoreanStudent,
  },
  {
    id: 'mad_fashion',
    displayName: 'Mad Fashion',
    displayNameRu: 'Мажор',
    profile: madFashionProfile,
    stable: madFashionStable,
    engineOutfit: 'trader',
    lobbyBg: lobbyMadFashion,
  },
  {
    id: 'rap_queen',
    displayName: 'Rap Queen',
    displayNameRu: 'Реперша',
    profile: rapQueenProfile,
    stable: rapQueenStable,
    engineOutfit: 'creator',
    lobbyBg: lobbyRapQueen,
  },
  {
    id: 'investor',
    displayName: 'Investor',
    displayNameRu: 'Инвестор',
    profile: investorProfile,
    stable: investorStable,
    engineOutfit: 'trader',
  },
];

function normalizeCharacterKey(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

const CHARACTER_BY_KEY = new Map<string, GeneratedCharacter>();

for (const character of GENERATED_CHARACTERS) {
  CHARACTER_BY_KEY.set(character.id, character);
  CHARACTER_BY_KEY.set(normalizeCharacterKey(character.displayName), character);
  CHARACTER_BY_KEY.set(normalizeCharacterKey(character.displayNameRu), character);
}

export function resolveGeneratedCharacter(value: string | undefined): GeneratedCharacter | undefined {
  return CHARACTER_BY_KEY.get(normalizeCharacterKey(value));
}

export function resolveGeneratedCharacterId(value: string | undefined): CharacterId | undefined {
  return resolveGeneratedCharacter(value)?.id;
}

export function resolveCharacterPortrait(value: string | undefined): string | undefined {
  return resolveGeneratedCharacter(value)?.profile;
}
