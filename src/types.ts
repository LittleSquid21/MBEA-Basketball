/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  rank?: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  position: string;
  avgPoints: number;
  avgRebounds: number;
  avgAssists?: number;
  avgSteals: number;
  avgBlocks: number;
  gamesPlayed: number;
}

export type GameStatus = 'scheduled' | 'live' | 'finished';

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string;
  status: GameStatus;
  venue: string;
  stage?: string;
  isTentative?: boolean;
}

export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
}
