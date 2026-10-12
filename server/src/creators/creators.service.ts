import { Injectable } from "@nestjs/common";
import { Caller, Db } from "../common/db/db";
import { ExploreQueryDto } from "./dto/explore-query.dto";
import { CreatorProfile } from "./entities/creator-profile.entity";
import { ExploreCreator } from "./entities/explore-creator.entity";

@Injectable()
export class CreatorsService {
  constructor(private readonly db: Db) {}

  /** Bookable creators, most completed orders first. */
  async explore(caller: Caller, { niche, limit, offset }: ExploreQueryDto): Promise<ExploreCreator[]> {
    return this.db.run(caller, async (q) => (await q.query<ExploreCreator>(`
      select id, name_ar, name_en, handle, city, bio, gender, niches, photo_path, completed_orders,
        rating, review_count, from_price
      from public.bookable_creators
      where $1::public.niche is null or $1::public.niche = any(niches)
      order by completed_orders desc, approved_at desc nulls last
      limit $2 offset $3
    `, [niche ?? null, limit, offset])).rows);
  }

  /** The whole profile in one query, or undefined if the creator doesn't exist or the caller can't see them. */
  async profile(caller: Caller, id: string): Promise<CreatorProfile | undefined> {
    const [row] = await this.db.run(caller, async (q) => (await q.query<CreatorProfile>(`
      select to_jsonb(c) - 'status' as creator,
        coalesce((select jsonb_agg(jsonb_build_object('format', f.format, 'price', f.price)) from public.creator_formats f where f.creator_id = c.id), '[]') as formats,
        coalesce((select jsonb_agg(jsonb_build_object('platform', s.platform, 'username', s.username)) from public.creator_socials s where s.creator_id = c.id), '[]') as socials,
        coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'video_path', p.video_path) order by p.created_at) from public.creator_portfolio p where p.creator_id = c.id), '[]') as portfolio,
        (select to_jsonb(r) - 'creator_id' from public.creator_ratings r where r.creator_id = c.id) as rating,
        coalesce((select jsonb_agg(to_jsonb(v) - 'creator_id' order by v.rated_at desc) from public.creator_reviews v where v.creator_id = c.id), '[]') as reviews,
        coalesce((select jsonb_agg(to_jsonb(pc) - 'creator_id' order by pc.approved_at desc) from public.public_clips pc where pc.creator_id = c.id), '[]') as clips
      from public.creators c where c.id = $1
    `, [id])).rows);
    return row;
  }
}
