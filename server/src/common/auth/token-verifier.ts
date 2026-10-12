import { createRemoteJWKSet, jwtVerify } from "jose";

/** Checks a Supabase access token and returns the user's id. Throws if the token isn't valid. */
export abstract class TokenVerifier {
  abstract verify(token: string): Promise<{ userId: string }>;
}

export class SupabaseTokenVerifier extends TokenVerifier {
  private readonly issuer: string;
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly secret?: Uint8Array;

  constructor(supabaseUrl: string, legacySecret?: string) {
    super();
    this.issuer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
    if (legacySecret) this.secret = new TextEncoder().encode(legacySecret);
    else this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verify(token: string) {
    const options = { issuer: this.issuer, audience: "authenticated" };
    const { payload } = this.secret ? await jwtVerify(token, this.secret, options) : await jwtVerify(token, this.jwks!, options);
    if (typeof payload.sub !== "string" || payload.role !== "authenticated") throw new Error("Not a signed-in user");
    return { userId: payload.sub };
  }
}
