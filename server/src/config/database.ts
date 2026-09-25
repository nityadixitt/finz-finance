import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

let sequelizeInstance: Sequelize | null = null;
let lastDbUrl: string | null = null;
let isDbConnected = false;
let isDbSynced = false;

export interface ParsedDbConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export function parseDatabaseUrl(urlStr: string): ParsedDbConfig {
  let str = urlStr.replace(/^mysql:\/\//i, '');

  const slashIdx = str.indexOf('/');
  let database = 'finz';
  let credsAndHost = str;
  if (slashIdx !== -1) {
    database = str.substring(slashIdx + 1).split('?')[0] || 'finz';
    credsAndHost = str.substring(0, slashIdx);
  }

  const lastAt = credsAndHost.lastIndexOf('@');
  let user = 'root';
  let password = '';
  let hostPort = credsAndHost;

  if (lastAt !== -1) {
    const creds = credsAndHost.substring(0, lastAt);
    hostPort = credsAndHost.substring(lastAt + 1);

    const colonIdx = creds.indexOf(':');
    if (colonIdx !== -1) {
      user = decodeURIComponent(creds.substring(0, colonIdx));
      password = decodeURIComponent(creds.substring(colonIdx + 1));
    } else {
      user = decodeURIComponent(creds);
    }
  }

  let host = 'localhost';
  let port = 3306;
  const colonHost = hostPort.indexOf(':');
  if (colonHost !== -1) {
    host = hostPort.substring(0, colonHost) || 'localhost';
    port = parseInt(hostPort.substring(colonHost + 1), 10) || 3306;
  } else {
    host = hostPort || 'localhost';
  }

  return { user, password, host, port, database };
}

export function getDatabaseUrl(): string {
  dotenv.config({ override: true });
  return process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/finz';
}

export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

export function isDatabaseSynced(): boolean {
  return isDbSynced;
}

export function setDatabaseSynced(synced: boolean) {
  isDbSynced = synced;
}

export function resetDatabaseConnection() {
  if (sequelizeInstance) {
    try {
      sequelizeInstance.close();
    } catch {}
    sequelizeInstance = null;
  }
  isDbConnected = false;
  isDbSynced = false;
  lastDbUrl = null;
}

export function getSequelize(): Sequelize {
  const currentDbUrl = getDatabaseUrl();
  if (!sequelizeInstance || lastDbUrl !== currentDbUrl) {
    if (sequelizeInstance) {
      try {
        sequelizeInstance.close();
      } catch {}
    }
    const config = parseDatabaseUrl(currentDbUrl);
    sequelizeInstance = new Sequelize(config.database, config.user, config.password, {
      host: config.host,
      port: config.port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    lastDbUrl = currentDbUrl;
    isDbConnected = false;
    isDbSynced = false;
  }
  return sequelizeInstance;
}

export async function initDatabase(): Promise<Sequelize> {
  const currentDbUrl = getDatabaseUrl();
  const config = parseDatabaseUrl(currentDbUrl);

  try {
    // 1. Ensure the MySQL database exists
    try {
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
      await connection.end();
      console.log(`[Database] MySQL database '${config.database}' ready.`);
    } catch (createErr: any) {
      console.warn(`[Database] Database pre-check notice: ${createErr.message}`);
    }

    // 2. Ensure singleton instance is authenticated
    const sequelize = getSequelize();
    await sequelize.authenticate();
    isDbConnected = true;
    console.log(`[Database] Sequelize successfully connected to MySQL database '${config.database}'.`);
    return sequelize;
  } catch (error: any) {
    isDbConnected = false;
    isDbSynced = false;
    console.error(`[Database] Failed to connect to MySQL: ${error.message}`);
    throw error;
  }
}
