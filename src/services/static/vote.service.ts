import type { DAppVote, ServiceResult } from '../types';
import type { IVoteService } from '../interfaces';

const VOTES_KEY = 'zapps_votes';

function loadVotes(): DAppVote[] {
  try {
    const stored = localStorage.getItem(VOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveVotes(votes: DAppVote[]): void {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

export class StaticVoteService implements IVoteService {
  async getByDApp(dappId: string): Promise<ServiceResult<DAppVote[]>> {
    try {
      const votes = loadVotes();
      const filtered = votes.filter(v => v.dapp_id === dappId);
      return { data: filtered, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getByUser(userId: string): Promise<ServiceResult<DAppVote[]>> {
    try {
      const votes = loadVotes();
      const filtered = votes.filter(v => v.user_id === userId);
      return { data: filtered, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getUserVoteForDApp(userId: string, dappId: string): Promise<ServiceResult<DAppVote>> {
    try {
      const votes = loadVotes();
      const vote = votes.find(v => v.user_id === userId && v.dapp_id === dappId) || null;
      return { data: vote, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async create(vote: Partial<DAppVote>): Promise<ServiceResult<DAppVote>> {
    try {
      const votes = loadVotes();
      
      const newVote: DAppVote = {
        id: crypto.randomUUID(),
        dapp_id: vote.dapp_id!,
        user_id: vote.user_id!,
        vote_amount: vote.vote_amount || 1,
        rating: vote.rating || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      votes.push(newVote);
      saveVotes(votes);
      
      return { data: newVote, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async update(id: string, data: Partial<DAppVote>): Promise<ServiceResult<DAppVote>> {
    try {
      const votes = loadVotes();
      const index = votes.findIndex(v => v.id === id);
      
      if (index === -1) {
        return { data: null, error: new Error('Vote not found') };
      }
      
      votes[index] = {
        ...votes[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      
      saveVotes(votes);
      return { data: votes[index], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getTotalForDApp(dappId: string): Promise<ServiceResult<number>> {
    try {
      const votes = loadVotes();
      const total = votes
        .filter(v => v.dapp_id === dappId)
        .reduce((sum, v) => sum + v.vote_amount, 0);
      return { data: total, error: null };
    } catch (error) {
      return { data: 0, error: error as Error };
    }
  }
}
