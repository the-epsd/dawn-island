import 'reflect-metadata';
import path from 'path';
import { Connection, createConnection, EntityManager } from 'typeorm';
import {
  Avatar, Conversation, Deck, DisconnectedSession, Match, Message, Replay, User,
  BattlePassSeason, UserBattlePass, UserUnlockedItem,
  Friend, FriendRequest, CardArtwork, UserFavoriteCard, Sleeve, MatchXpAward
} from './';

export class Storage {

  private connection: null | Connection = null;

  constructor() { }

  public async connect(): Promise<void> {
    const storageType = process.env.STORAGE_TYPE || 'sqlite';
    const storageConfig: Record<string, unknown> = { type: storageType };

    if (storageType === 'sqlite') {
      storageConfig.database = process.env.STORAGE_DATABASE || path.join(process.cwd(), 'database.sq3');
    } else {
      storageConfig.host = process.env.STORAGE_HOST;
      storageConfig.port = process.env.STORAGE_PORT;
      storageConfig.username = process.env.STORAGE_USERNAME;
      storageConfig.password = process.env.STORAGE_DATABASE_PASSWORD;
      storageConfig.database = process.env.STORAGE_DATABASE;
    }

    this.connection = await createConnection({
      ...(storageConfig as any),
      timezone: 'Z',
      entities: [
        Avatar,
        Conversation,
        Deck,
        DisconnectedSession,
        Friend,
        FriendRequest,
        Match,
        Message,
        Replay,
        User,
        BattlePassSeason,
        UserBattlePass,
        UserUnlockedItem,
        CardArtwork,
        UserFavoriteCard,
        Sleeve,
        MatchXpAward
      ],
      synchronize: true,
      logging: false
    });
  }

  public async disconnect(): Promise<void> {
    if (this.connection === null) {
      return;
    }
    return this.connection.close();
  }

  public get manager(): EntityManager {
    if (this.connection === null) {
      throw new Error('Not connected to the database.');
    }
    return this.connection.manager;
  }

  public async checkConnection(): Promise<boolean> {
    if (this.connection === null) {
      return false;
    }
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

}
