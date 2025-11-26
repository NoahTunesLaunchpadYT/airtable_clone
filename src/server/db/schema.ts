import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `airtable_clone_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .$defaultFn(() => /* @__PURE__ */ new Date()),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);









import {
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb
} from "drizzle-orm/pg-core";

export const columnTypeEnum = pgEnum("airtable_clone_column_type", [
  "text",
  "number",
  "singleSelect",
  "attachment"
]);

export const workspaces = createTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(), // keep consistent with your current bases.ownerId
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (t) => [
    index("workspaces_owner_idx").on(t.ownerId),
    index("workspaces_owner_name_idx").on(t.ownerId, t.name),
  ],
);

export const bases = createTable(
  "bases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    starred: boolean("starred").notNull().default(false),

    // this is your "last_modified"
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("bases_owner_idx").on(t.ownerId),
    index("bases_workspace_idx").on(t.workspaceId),
    index("bases_owner_starred_idx").on(t.ownerId, t.starred),
    index("bases_last_modified_idx").on(t.ownerId, t.lastModifiedAt),
  ],
);

export const tables = createTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),                  // Table ID
  baseId: uuid("base_id")                                       // Reference to the base
    .notNull()
    .references(() => bases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                                 // Table name
  orderIndex: integer("order_index").notNull().default(0),      // Index within user's tables
  createdAt: timestamp("created_at").defaultNow()               // Creation timestamp
});

export const columns = createTable("columns", {
  id: uuid("id").primaryKey().defaultRandom(),                  // Column ID
  tableId: uuid("table_id")                                     // Reference to the table
    .notNull()
    .references(() => tables.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                                 // Column name
  type: columnTypeEnum("type").notNull(),                       // Column type
  orderIndex: integer("order_index").notNull().default(0),      // Order index for sorting within table
  isHidden: boolean("is_hidden").notNull().default(false),      // Visibility flag
  config: jsonb("config")                                       // Additional configuration
});

export const rows = createTable(
  "rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => tables.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    values: jsonb("values").notNull(),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => [
    index("rows_table_index_idx").on(table.tableId, table.index),
    index("rows_table_id_idx").on(table.tableId)
  ]
);
