import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentCaller } from "../common/auth/decorators";
import { Caller } from "../common/db/db";
import { ApiBodyExamples, ApiErrors } from "../common/openapi/docs";
import { Creator } from "../creators/entities/creator.entity";
import { CreatorProfileService } from "./creator-profile.service";
import { CreateAddressDto, UpdateAddressDto } from "./dto/address.dto";
import { AddSampleDto, SubmitApplicationDto } from "./dto/application.dto";
import { CreateCreatorProfileDto, UpdateCreatorProfileDto } from "./dto/creator-profile.dto";
import { FormatPriceDto, SetFormatsDto, SetSocialsDto, SocialDto } from "./dto/offer-settings.dto";
import { Address, MyCreatorProfile, Sample } from "./entities/my-profile.entity";

const NO_PROFILE = "No creator profile yet. Create it first.";

/** The signed-in creator's own profile, prices, socials, samples, addresses and application. */
@ApiTags("My creator profile")
@ApiBearerAuth()
@Controller("me/creator")
export class CreatorProfileController {
  constructor(private readonly profile: CreatorProfileService) {}

  @Get()
  @ApiOperation({ summary: "My creator profile", description: "Profile, prices, socials, samples, addresses and the latest application." })
  @ApiOkResponse({ type: MyCreatorProfile })
  @ApiErrors(401, 404)
  async get(@CurrentCaller() caller: Caller): Promise<MyCreatorProfile> {
    const profile = await this.profile.get(caller);
    if (!profile) throw new NotFoundException(NO_PROFILE);
    return profile;
  }

  @Post()
  @ApiOperation({ summary: "Create my creator profile", description: "After POST /me with role creator. Starts as incomplete." })
  @ApiBodyExamples(CreateCreatorProfileDto, {
    "Sign-up": { handle: "dana.glow", name_ar: "دانة", name_en: "Dana", city: "Manama", gender: "female", shows_face: true, niches: ["beauty", "fashion"] },
  })
  @ApiCreatedResponse({ type: Creator })
  @ApiErrors(400, 401, 403, 409)
  create(@CurrentCaller() caller: Caller, @Body() body: CreateCreatorProfileDto): Promise<Creator> {
    return this.profile.create(caller, body);
  }

  @Patch()
  @ApiOperation({ summary: "Edit my creator profile", description: "Only the fields sent change; null clears an optional one." })
  @ApiBodyExamples(UpdateCreatorProfileDto, {
    "Bio and niches": { bio: "Skincare and slow mornings in Manama.", niches: ["beauty"] },
    Photo: { photo_path: "<your user id>/photo.jpg" },
  })
  @ApiOkResponse({ type: Creator })
  @ApiErrors(400, 401, 404, 409)
  async update(@CurrentCaller() caller: Caller, @Body() body: UpdateCreatorProfileDto): Promise<Creator> {
    const creator = await this.profile.update(caller, body);
    if (!creator) throw new NotFoundException(NO_PROFILE);
    return creator;
  }

  @Put("formats")
  @ApiOperation({ summary: "Set my prices", description: "Replaces the list. The price is what the creator gets; brands see it plus the fee." })
  @ApiBodyExamples(SetFormatsDto, {
    "Reel and story": { formats: [{ format: "instagram_reel", price: 35 }, { format: "instagram_story", price: 15 }] },
  })
  @ApiOkResponse({ type: [FormatPriceDto] })
  @ApiErrors(400, 401)
  setFormats(@CurrentCaller() caller: Caller, @Body() body: SetFormatsDto): Promise<FormatPriceDto[]> {
    return this.profile.setFormats(caller, body);
  }

  @Put("socials")
  @ApiOperation({ summary: "Set my social accounts", description: "Replaces the list: one username per platform, without @." })
  @ApiBodyExamples(SetSocialsDto, { Instagram: { socials: [{ platform: "instagram", username: "dana.glow" }] } })
  @ApiOkResponse({ type: [SocialDto] })
  @ApiErrors(400, 401)
  setSocials(@CurrentCaller() caller: Caller, @Body() body: SetSocialsDto): Promise<SocialDto[]> {
    return this.profile.setSocials(caller, body);
  }

  @Post("portfolio")
  @ApiOperation({ summary: "Add a sample clip", description: "Up to 3. Upload to public-media first, in your own folder." })
  @ApiBodyExamples(AddSampleDto, { Sample: { video_path: "<your user id>/sample-1.mp4" } })
  @ApiCreatedResponse({ type: Sample })
  @ApiErrors(400, 401)
  addSample(@CurrentCaller() caller: Caller, @Body() body: AddSampleDto): Promise<Sample> {
    return this.profile.addSample(caller, body);
  }

  @Delete("portfolio/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove a sample clip" })
  @ApiNoContentResponse({ description: "Removed" })
  @ApiErrors(400, 401, 404)
  async removeSample(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    if (!(await this.profile.removeSample(caller, id))) throw new NotFoundException("Sample not found");
  }

  @Get("addresses")
  @ApiOperation({ summary: "My addresses", description: "Oldest first." })
  @ApiOkResponse({ type: [Address] })
  @ApiErrors(401)
  addresses(@CurrentCaller() caller: Caller): Promise<Address[]> {
    return this.profile.addresses(caller);
  }

  @Post("addresses")
  @ApiOperation({ summary: "Add an address", description: "Up to 5. The map pin is optional." })
  @ApiBodyExamples(CreateAddressDto, {
    "Home with a pin": { type: "home", address_text: "Building 1234, Road 4567, Block 345, Manama", latitude: 26.2235, longitude: 50.5876 },
    "Named, no pin": { type: "home", label: "Parents' house", address_text: "Villa 12, Road 33, Riffa" },
  })
  @ApiCreatedResponse({ type: Address })
  @ApiErrors(400, 401)
  addAddress(@CurrentCaller() caller: Caller, @Body() body: CreateAddressDto): Promise<Address> {
    return this.profile.addAddress(caller, body);
  }

  @Patch("addresses/:id")
  @ApiOperation({ summary: "Edit an address", description: "Only the fields sent change. Send latitude and longitude together." })
  @ApiBodyExamples(UpdateAddressDto, { "Rename it": { label: "Office" }, "Remove the pin": { latitude: null, longitude: null } })
  @ApiOkResponse({ type: Address })
  @ApiErrors(400, 401, 404)
  async updateAddress(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateAddressDto): Promise<Address> {
    const address = await this.profile.updateAddress(caller, id, body);
    if (!address) throw new NotFoundException("Address not found");
    return address;
  }

  @Delete("addresses/:id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove an address" })
  @ApiNoContentResponse({ description: "Removed" })
  @ApiErrors(400, 401, 404)
  async removeAddress(@CurrentCaller() caller: Caller, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    if (!(await this.profile.removeAddress(caller, id))) throw new NotFoundException("Address not found");
  }

  @Post("application")
  @ApiOperation({
    summary: "Send for review",
    description: "Needs an intro video, a sample, a social account, city, niches and prices. Again after changes were requested or a rejection (the intro can be left out then).",
  })
  @ApiBodyExamples(SubmitApplicationDto, { "First time": { intro_video_path: "<your user id>/intro.mp4" }, "Resubmit, same intro": {} })
  @ApiCreatedResponse({ type: MyCreatorProfile })
  @ApiErrors(400, 401, 403, 404, 409)
  submit(@CurrentCaller() caller: Caller, @Body() body: SubmitApplicationDto): Promise<MyCreatorProfile> {
    return this.profile.submit(caller, body);
  }
}
