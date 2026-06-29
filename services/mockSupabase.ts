import { User, Session } from "@supabase/supabase-js";

// Global database storage for the server-side in-memory mock DB
const globalSymbols = Symbol.for("agrinova.mockdb");
let memoryDb: Record<string, any[]>;

if (typeof window === "undefined") {
  const globalRef = global as any;
  if (!globalRef[globalSymbols]) {
    globalRef[globalSymbols] = {
      users: [
        {
          id: "u1",
          email: "farmer@agrinova.com",
          user_metadata: { full_name: "Demo Farmer" },
          aud: "authenticated",
          role: "authenticated"
        }
      ],
      email_verifications: [],
      feedback: [],
      questions: [
        {
          id: "q1",
          title: "What is the best crop for clay soil in summer?",
          content: "I have a farm in a warm climate with clay soil. I'm wondering what crops are recommended for the upcoming summer season.",
          category: "crops",
          user_name: "Ramesh Kumar",
          answers_count: 1,
          views: 12,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: "q2",
          title: "How to identify late blight in potato plants?",
          content: "Some leaves on my potato crops are showing dark spots with white mold underneath. Is this late blight and what are the treatments?",
          category: "diseases",
          user_name: "Suresh Patil",
          answers_count: 0,
          views: 5,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      answers: [
        {
          id: "a1",
          question_id: "q1",
          content: "Clay soil retains water well, so crops like rice, cotton, and soybean grow very well in it during summer, provided there is good drainage.",
          user_name: "Dr. Amit Sharma",
          is_accepted: true,
          upvotes: 4,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      profiles: [],
      farms: [
        {
          id: "f1",
          user_id: "u1",
          name: "Green Valley Farm",
          location: "Pune, Maharashtra",
          soil_type: "Clayey",
          land_area: 5.2,
          latitude: 18.5204,
          longitude: 73.8567,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      transactions: [
        {
          id: "t1",
          farm_id: "f1",
          type: "income",
          category: "Crop Sale",
          description: "Sold 500kg tomatoes",
          amount: 15000,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        },
        {
          id: "t2",
          farm_id: "f1",
          type: "expense",
          category: "Seeds",
          description: "Purchased tomato seeds",
          amount: 2500,
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      ],
      scans: []
    };
  }
  memoryDb = globalRef[globalSymbols];
} else {
  memoryDb = {};
}

function getMockData(table: string): any[] {
  if (typeof window !== "undefined") {
    const localData = localStorage.getItem(`sb-mock-db-${table}`);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (e) {
        // ignore
      }
    }
    const defaultData = (table === "questions") ? [
      {
        id: "q1",
        title: "What is the best crop for clay soil in summer?",
        content: "I have a farm in a warm climate with clay soil. I'm wondering what crops are recommended for the upcoming summer season.",
        category: "crops",
        user_name: "Ramesh Kumar",
        answers_count: 1,
        views: 12,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "q2",
        title: "How to identify late blight in potato plants?",
        content: "Some leaves on my potato crops are showing dark spots with white mold underneath. Is this late blight and what are the treatments?",
        category: "diseases",
        user_name: "Suresh Patil",
        answers_count: 0,
        views: 5,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ] : (table === "answers") ? [
      {
        id: "a1",
        question_id: "q1",
        content: "Clay soil retains water well, so crops like rice, cotton, and soybean grow very well in it during summer, provided there is good drainage.",
        user_name: "Dr. Amit Sharma",
        is_accepted: true,
        upvotes: 4,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ] : (table === "farms") ? [
      {
        id: "f1",
        user_id: "u1",
        name: "Green Valley Farm",
        location: "Pune, Maharashtra",
        soil_type: "Clayey",
        land_area: 5.2,
        latitude: 18.5204,
        longitude: 73.8567,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ] : (table === "transactions") ? [
      {
        id: "t1",
        farm_id: "f1",
        type: "income",
        category: "Crop Sale",
        description: "Sold 500kg tomatoes",
        amount: 15000,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: "t2",
        farm_id: "f1",
        type: "expense",
        category: "Seeds",
        description: "Purchased tomato seeds",
        amount: 2500,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
    ] : [];
    
    localStorage.setItem(`sb-mock-db-${table}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return memoryDb[table] || [];
}

function saveMockData(table: string, data: any[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`sb-mock-db-${table}`, JSON.stringify(data));
  } else {
    memoryDb[table] = data;
  }
}

class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*") {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  or(queryStr: string) {
    this.filters.push((item) => {
      const parts = queryStr.split(",");
      return parts.some(part => {
        const subParts = part.split(".");
        if (subParts.length < 3) return false;
        const col = subParts[0];
        const val = subParts[2];
        if (!item[col]) return false;
        const itemVal = String(item[col]).toLowerCase();
        const searchVal = (val || "").replace(/%/g, "").toLowerCase();
        return itemVal.includes(searchVal);
      });
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAscending = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const data = await this.executeSelect();
      const result = { data, error: null };
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err) {
      const result = { data: null, error: err };
      if (onrejected) return onrejected(err);
      return result;
    }
  }

  private async executeSelect() {
    const data = getMockData(this.table);
    let filtered = data.filter(item => this.filters.every(fn => fn(item)));
    if (this.orderCol) {
      filtered.sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }
    return filtered;
  }

  async insert(values: any) {
    const records = Array.isArray(values) ? values : [values];
    const data = getMockData(this.table);
    const newRecords = records.map(r => ({
      id: r.id || Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString(),
      ...r
    }));
    data.push(...newRecords);
    saveMockData(this.table, data);
    return { data: newRecords, error: null };
  }

  async update(values: any) {
    const data = getMockData(this.table);
    let updatedCount = 0;
    const updatedRecords = data.map(item => {
      if (this.filters.every(fn => fn(item))) {
        updatedCount++;
        return { ...item, ...values, updated_at: new Date().toISOString() };
      }
      return item;
    });
    if (updatedCount > 0) {
      saveMockData(this.table, updatedRecords);
    }
    const affected = updatedRecords.filter(item => this.filters.every(fn => fn(item)));
    return { data: affected, error: null };
  }

  async delete() {
    const data = getMockData(this.table);
    const remaining = data.filter(item => !this.filters.every(fn => fn(item)));
    saveMockData(this.table, remaining);
    return { data: null, error: null };
  }
}

class MockAuth {
  private listeners: Set<(event: string, session: Session | null) => void> = new Set();
  private currentSession: Session | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sb-mock-session");
      if (stored) {
        try {
          this.currentSession = JSON.parse(stored);
        } catch (e) {
          this.currentSession = null;
        }
      }
    }
  }

  private saveSession(session: Session | null) {
    this.currentSession = session;
    if (typeof window !== "undefined") {
      if (session) {
        localStorage.setItem("sb-mock-session", JSON.stringify(session));
      } else {
        localStorage.removeItem("sb-mock-session");
      }
    }
    this.listeners.forEach((cb) => {
      try {
        cb(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      } catch (err) {
        // ignore callback errors
      }
    });
  }

  async getSession() {
    this.loadSession();
    return { data: { session: this.currentSession }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    this.listeners.add(callback);
    try {
      callback(this.currentSession ? "INITIAL_SESSION" : "SIGNED_OUT", this.currentSession);
    } catch (e) {}
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }

  async signInWithPassword({ email, password }: any) {
    const users = this.getUsers();
    let user = users.find(u => u.email === email);
    if (!user) {
      const cleanEmail = email || "farmer@agrinova.com";
      const fullName = cleanEmail.includes("@") ? cleanEmail.split("@")[0] : cleanEmail;
      const finalEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@agrinova.com`;
      user = {
        id: "mock-user-id-" + Math.random().toString(36).substring(2, 15),
        email: finalEmail,
        created_at: new Date().toISOString(),
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: "authenticated",
        role: "authenticated",
      };
      users.push(user);
      this.saveUsers(users);

      const profiles = getMockData("profiles");
      profiles.push({
        id: user.id,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      saveMockData("profiles", profiles);
    }

    const tokenPayload = { id: user.id, email: user.email, full_name: user.user_metadata?.full_name };
    const encodedToken = "mock-token::" + Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    const session: Session = {
      access_token: encodedToken,
      refresh_token: "mock-refresh-token-" + Math.random(),
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "bearer",
      user: user as User,
    };
    this.saveSession(session);
    return { data: { session, user: user as User }, error: null };
  }

  async signUp({ email, password, options }: any) {
    const users = this.getUsers();
    if (users.some(u => u.email === email)) {
      return { data: { user: null }, error: { message: "User already registered" } };
    }
    const fullName = options?.data?.full_name || email.split("@")[0];
    const newUser = {
      id: "mock-user-id-" + Math.random().toString(36).substring(2, 15),
      email,
      created_at: new Date().toISOString(),
      user_metadata: { full_name: fullName },
      app_metadata: {},
      aud: "authenticated",
      role: "authenticated",
    };
    users.push(newUser);
    this.saveUsers(users);

    const profiles = getMockData("profiles");
    profiles.push({
      id: newUser.id,
      full_name: fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    saveMockData("profiles", profiles);

    return { data: { user: newUser as User }, error: null };
  }

  async signOut() {
    this.saveSession(null);
    return { error: null };
  }

  async setSession({ access_token, refresh_token }: any) {
    let email = "farmer@agrinova.com";
    let fullName = "Demo Farmer";
    let userId = "mock-user-id-from-token";

    if (access_token && access_token.startsWith("mock-token::")) {
      try {
        const payloadStr = Buffer.from(access_token.substring(12), "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        if (payload.email) email = payload.email;
        if (payload.full_name) fullName = payload.full_name;
        if (payload.id) userId = payload.id;
      } catch (e) {
        // ignore
      }
    }

    const session: Session = {
      access_token,
      refresh_token,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "bearer",
      user: {
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: "authenticated",
        role: "authenticated",
      } as User
    };
    this.saveSession(session);
    return { data: { session, user: session.user }, error: null };
  }

  admin = {
    createUser: async ({ email, password, email_confirm, user_metadata }: any) => {
      const users = this.getUsers();
      if (users.some(u => u.email === email)) {
        return { data: { user: null }, error: { message: "User already exists" } };
      }
      const newUser = {
        id: "mock-user-id-" + Math.random().toString(36).substring(2, 15),
        email,
        created_at: new Date().toISOString(),
        user_metadata: user_metadata || {},
        app_metadata: {},
        aud: "authenticated",
        role: "authenticated",
      };
      users.push(newUser);
      this.saveUsers(users);

      const profiles = getMockData("profiles");
      profiles.push({
        id: newUser.id,
        full_name: user_metadata?.full_name || email.split("@")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      saveMockData("profiles", profiles);

      return { data: { user: newUser as User }, error: null };
    }
  };

  private getUsers(): any[] {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sb-mock-users");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
      const defaultUsers = [
        {
          id: "u1",
          email: "farmer@agrinova.com",
          user_metadata: { full_name: "Demo Farmer" },
          aud: "authenticated",
          role: "authenticated"
        }
      ];
      localStorage.setItem("sb-mock-users", JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    if (!memoryDb.users) {
      memoryDb.users = [
        {
          id: "u1",
          email: "farmer@agrinova.com",
          user_metadata: { full_name: "Demo Farmer" },
          aud: "authenticated",
          role: "authenticated"
        }
      ];
    }
    return memoryDb.users;
  }

  private saveUsers(users: any[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("sb-mock-users", JSON.stringify(users));
    } else {
      memoryDb.users = users;
    }
  }
}

export class MockSupabaseClient {
  auth = new MockAuth();

  from(table: string) {
    return new MockQueryBuilder(table);
  }
}
