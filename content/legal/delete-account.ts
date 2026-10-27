// The Delete account page's text, in the format components/legal/LegalDocument.tsx reads: English,
// then a line with "---", then Arabic. Edit the words here. It's a module rather than a .md file so it's
// bundled with the app: the live site runs on Cloudflare Workers, which can't read files at request time.
const text = `<!-- Shown at /delete-account, the account-deletion address given to Google Play (golaqta.com/delete-account forwards here): keep it. What's deleted follows the API's erase (100clips-backend, src/moderation): change both together. -->
# Delete your laqta account

**Last updated:** October 27, 2026

To delete your laqta account and its data, ask us:

- **Creators (the laqta app):** email **hello@golaqta.com** from the email you sign in with, or send
  a WhatsApp to **+973 6660 4882**. Write: "Please delete my laqta account" and your account's
  email.
- **Brands (the laqta website):** email **hello@golaqta.com** from the email you sign in with, or
  send a WhatsApp to **+973 6660 4882**. Write: "Please delete my laqta account" and your account's
  email.

We confirm it's you and delete the account within **30 days**. We'll reply when it's done.

**What's deleted for creators:** your profile, photo, sample and intro videos, social accounts,
prices, saved addresses, bank details, and messages.

**What's deleted for brands:** your account name; each brand's logo, description, website and social
accounts (the brand's name becomes "Deleted account"); its CR number and VAT certificate; the app
links, test accounts and promo codes you gave creators; saved drafts, your cart and creator lists;
bank details; and messages.

**What's kept, and for how long:** payment and tax records we must keep by law, only for as long as
the law requires. Videos already delivered to a brand stay with that brand, under the terms agreed
for that order, and past orders keep their campaign and product details. Reviews may stay without
your name.

Orders still running are finished or cancelled first. If you have money waiting, add a bank account
first so we can send it before deleting.

---

# حذف حسابك في لقطة

**آخر تحديث:** 27 أكتوبر 2026

عشان تحذف حسابك في لقطة وبياناته، اطلب منا:

- **صنّاع المحتوى (تطبيق لقطة):** راسل **hello@golaqta.com** من البريد اللي تدخل فيه، أو أرسل رسالة واتساب إلى
  **+973 6660 4882**. واكتب: "أبي أحذف حسابي في لقطة" وبريد حسابك.
- **البراندات (موقع لقطة):** راسل **hello@golaqta.com** من البريد اللي تدخل فيه، أو أرسل رسالة واتساب إلى
  **+973 6660 4882**. واكتب: "أبي أحذف حسابي في لقطة" وبريد حسابك.

نتأكد إنك صاحب الحساب ونحذفه خلال **30 يوم**، ونرد عليك لما يخلص.

**وش ينحذف لصنّاع المحتوى:** ملفك، وصورتك، وفيديوهات العينات والتعريف، وحساباتك في التواصل، وأسعارك، وعناوينك
المحفوظة، وبياناتك البنكية، ورسائلك.

**وش ينحذف للبراندات:** اسم حسابك، وشعار كل براند ونبذته وموقعه الإلكتروني وحساباته في التواصل (ويصير اسم
البراند "حساب محذوف")، ورقم السجل التجاري وشهادة الضريبة، وروابط التطبيقات وحسابات التجربة وأكواد الخصم اللي عطيتها
لصنّاع المحتوى، والمسودات المحفوظة، والسلة، وقوائم صنّاع المحتوى، وبياناتك البنكية، ورسائلك.

**وش يبقى، وكم:** سجلات الدفع والضرائب اللي يلزمنا القانون نحتفظ فيها، وللمدة اللي يطلبها القانون فقط. والفيديوهات
اللي انسلّمت لبراند تبقى عنده حسب الشروط المتفق عليها في ذاك الطلب، والطلبات السابقة تبقى بتفاصيل حملتها
ومنتجها. والتقييمات ممكن تبقى بدون اسمك.

الطلبات الجارية تخلص أو تنلغى قبل الحذف. وإذا عندك فلوس ما وصلتك، أضف حسابك البنكي أول عشان نحوّلها قبل الحذف.
`;

export default text;
