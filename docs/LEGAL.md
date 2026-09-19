# Legal — what is built, and what is still a placeholder

**The mechanism is real. The wording is not.** Everything in this document
describes engineering that works and text that a lawyer has to replace before
Travel Art takes money from the public.

## What is built and working

| Obligation | Where | Status |
|---|---|---|
| Affirmative acceptance at sign-up | `backend/src/routes/auth.ts` — `acceptTerms: z.literal(true)` | Enforced server-side. A missing field, `false`, or a string all fail closed with 400. |
| Proof of consent (GDPR Art. 7(1)) | `ConsentRecord` model | Append-only ledger. A withdrawal is a new row, never an edit. Records the document version, a salted IP digest and the user agent. |
| Right of access (Art. 15) | `GET /api/privacy/export` | Returns the full record as a downloadable JSON document. Named-field selects throughout, so the counterparty to a residency is never included — they are a different data subject. |
| Right to erasure (Art. 17) | `DELETE /api/privacy/account` | Requires the password **and** the typed word `SUPPRIMER`. Anonymises in place rather than deleting, see below. |
| Consent withdrawal | `POST /api/privacy/consent` | Any kind can be granted or withdrawn at any time. |
| Session revocation on erasure | `sessionsValidFrom` | Every token issued before the erasure stops working immediately. |

### Why erasure anonymises rather than deletes

Article 17(3)(b) preserves erasure against other legal duties, and French
accounting law requires invoices and the transactions behind them to be kept
for years. Hard-deleting the user row would either cascade those away or orphan
them. So every piece of personal data is destroyed in place — email tombstoned,
name replaced, phone, country, bio, images, stage name, hotel contacts all
nulled, notifications deleted — while the financial rows keep pointing at a
subject who can no longer be identified from them.

**Verified:** after erasure the row reads
`deleted-<random>@deleted.invalid` / `Compte supprimé`, the artist profile's
bio, images and stage name are `null`, the old token returns 401 and the old
credentials return 401.

### Versioning

`LEGAL_VERSION` in `backend/src/config/legal.ts` is stamped on every consent.
**Bump it whenever the terms or the privacy policy change materially.** A stored
consent carries the version it was given against, so a later revision cannot
silently claim agreement to text nobody has read. Bumping it does not
retroactively invalidate anything — it means new consents record the new
version, and you can see at a glance who accepted which.

## What a lawyer must replace

The three published pages — `TermsPage`, `PrivacyPolicyPage`, `CookiePolicyPage`
— are **placeholders**. They are short, generic, and do not reflect what this
business actually does. Specifically missing:

1. **Identity of the controller.** Legal name, company registration number,
   registered address, publication director. Mandatory in France (LCEN).
2. **What Travel Art is, contractually.** Is it a party to the residency, or an
   intermediary between the artist and the hotel? This determines who is liable
   when a residency goes wrong, and the current text does not say.
3. **The residency terms as contract.** Seven nights, two hours a day, room and
   full board for the artist and one companion, a named referent. These are
   sold on the About page as promises and are currently editorial copy only.
4. **Cancellation and refund terms**, for both sides, with notice periods. The
   credit refund on cancellation is implemented; the terms describing it are not.
5. **The rating system.** Reviews affect artists' livelihoods. Right of reply,
   moderation criteria, and grounds for removal all need stating.
6. **Data processing specifics.** Legal basis per purpose, retention periods,
   sub-processors (Stripe, Resend, Neon, Vercel/Render, Cloudinary), and
   international transfers — Neon is in `us-east-1`, which is a transfer out of
   the EEA and needs a documented basis.
7. **Governing law and jurisdiction**, across France, Morocco and Spain.
8. **Artist status.** Whether an artist in residency is a contractor, and what
   that means for social contributions in each country. This is the one most
   likely to become expensive.

## Before launch

- [ ] Counsel reviews and replaces the three pages
- [ ] `LEGAL_VERSION` bumped to the date of the reviewed text
- [ ] Controller identity published (legal mentions page)
- [ ] Sub-processor list published in the privacy policy
- [ ] Decide and state the intermediary-vs-party question

Accounts created before the consent gate existed have `acceptedTermsAt = NULL`.
That is deliberate — backfilling them would be inventing a consent that was
never given. They should be asked to accept on next sign-in.
