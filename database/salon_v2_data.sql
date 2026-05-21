pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: erp_master_category
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
pg_dump: warning: there are circular foreign-key constraints on this table:
pg_dump: detail: erp_master_account
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
pg_dump: hint: Consider using a full dump instead of a --data-only dump to avoid this problem.
--
-- PostgreSQL database dump
--

\restrict y3ga4nYjoe7diwzRWQrhK2F6pkvyka8ieTzfWonofG2Dg1rdhsrafmukVeWIHWU

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Customer" (id, name, phone, instagram, birthday, notes, total_visit, total_spending, active, created_at, updated_at) FROM stdin;
03f89239-578e-43a4-b35d-08fe0c879d94	Dipa Maginov	08123456789	\N	\N	\N	1	300000	t	2026-05-18 23:00:39.265	2026-05-18 23:00:39.297
46d6f966-683e-4751-bbf0-6919e880d7aa	Firly Y K	08224618731	\N	\N	\N	0	0	t	2026-05-18 23:22:09.92	2026-05-18 23:22:09.92
5a68e1ed-3e8d-4dc8-a0fa-5ef967ce2cc0	gebgirl	08124846187	\N	\N	\N	0	0	t	2026-05-18 23:22:39.436	2026-05-18 23:22:39.436
00bb1d74-8d93-4660-a3b1-b0c3e17bf2a7	Test Customer	08123456789	\N	\N	\N	0	0	t	2026-05-18 23:23:27.608	2026-05-18 23:23:27.608
db686a18-450e-45da-b212-2e9fa16733d6	Test	123	\N	\N	\N	0	0	t	2026-05-18 23:24:14.098	2026-05-18 23:24:14.098
1ea550e3-07c1-4263-8ed5-127c7889c965	Test Browser	08123	\N	\N	\N	0	0	t	2026-05-18 23:24:35.417	2026-05-18 23:24:35.417
3e14adfd-c758-427b-a1ef-a73d93b87ac5	English Test	0812345	\N	\N	\N	0	0	t	2026-05-18 23:29:39.952	2026-05-18 23:29:39.952
3747982b-3618-4aa0-9e64-5473159682dc	Final Test	999	\N	\N	\N	0	0	t	2026-05-18 23:30:08.255	2026-05-18 23:30:08.255
8cade849-fc0e-4438-bf97-5eccb0bcd09f	Test Auto	081111	\N	\N	\N	0	0	t	2026-05-19 07:20:22.13	2026-05-19 07:20:22.13
6e4f0ecc-9418-44db-943a-6fff25ad6928	Test Auto2	081112	\N	\N	\N	0	0	t	2026-05-19 07:20:31.427	2026-05-19 07:20:31.427
59413a53-01e8-4c7f-ada6-03facf44376d	Final Test	081113	\N	\N	\N	2	500000	t	2026-05-19 07:22:31.089	2026-05-19 07:22:41.687
\.


--
-- Data for Name: Service; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Service" (id, name, category, price, duration_min, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Staff" (id, name, role, phone, commission_type, commission_value, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Booking" (id, date, "time", customer_name, customer_id, customer_phone, service_id, service_name, staff_id, staff_name, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: PosSession; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."PosSession" (id, code, opened_at, closed_at, opened_by, closed_by, opening_cash, closing_cash, expected_cash, difference, total_sales, total_transactions, notes, status, erp_doc_key, erp_synced_at, created_at, updated_at) FROM stdin;
d7edcec8-5982-4ae9-813e-40f00c705ef9	SFT-20260518-0001	2026-05-18 23:00:19.911	2026-05-18 23:07:29.753	Admin	\N	500000	800000	800000	0	300000	1	Closing test	CLOSED	POS-BSD-20260518-0005	2026-05-18 23:07:29.791	2026-05-18 23:00:19.911	2026-05-18 23:07:29.792
b95834fc-8f7b-42e6-b49c-bac0d70c5644	SFT-20260519-0001	2026-05-19 06:10:08.222	2026-05-19 06:10:14.798	admin	\N	500000	500000	500000	0	0	0	\N	CLOSED	POS-BSD-20260519-0001	2026-05-19 06:10:14.926	2026-05-19 06:10:08.222	2026-05-19 06:10:14.927
652d798b-88b0-4258-9e41-e5b75d4774a7	SFT-20260519-0002	2026-05-19 06:14:09.201	2026-05-19 06:14:16.714	admin	\N	50000	50000	50000	0	0	0	\N	CLOSED	POS-BSD-20260519-0002	2026-05-19 06:14:16.748	2026-05-19 06:14:09.201	2026-05-19 06:14:16.749
7a797ef5-1abe-4136-9c48-7ec4b7759e6e	SFT-20260519-0003	2026-05-19 06:14:37.644	2026-05-19 06:14:43.769	admin	\N	50000	50000	50000	0	0	0	\N	CLOSED	POS-BSD-20260519-0003	2026-05-19 06:14:43.796	2026-05-19 06:14:37.644	2026-05-19 06:14:43.798
46ba6098-a1a6-4ee4-8664-c0a35ad59539	SFT-20260519-0004	2026-05-19 06:28:35.64	2026-05-19 06:28:44.42	admin	\N	500000	500000	500000	0	0	0	\N	CLOSED	POS-BSD-20260519-0004	2026-05-19 06:28:44.458	2026-05-19 06:28:35.64	2026-05-19 06:28:44.459
5d8b78c1-eb74-4af5-912e-7d75db557719	SFT-20260519-0005	2026-05-19 06:39:40.748	2026-05-19 06:39:46.26	admin	\N	50000	50000	50000	0	0	0	\N	CLOSED	POS-BSD-20260519-0005	2026-05-19 06:39:46.298	2026-05-19 06:39:40.748	2026-05-19 06:39:46.299
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Transaction" (id, code, date, customer_id, customer_name, staff_id, staff_name, subtotal, discount, grand_total, payment_status, notes, created_at, session_id, erp_synced, erp_doc_key, erp_synced_at) FROM stdin;
c2286c7f-8886-404e-ba5d-6c832f07296f	TRX-20260518-0001	2026-05-18 23:00:39.267	03f89239-578e-43a4-b35d-08fe0c879d94	Dipa Maginov	\N	\N	300000	0	300000	PAID	Test transaksi	2026-05-18 23:00:39.278	d7edcec8-5982-4ae9-813e-40f00c705ef9	f	\N	\N
38ad0f62-6aaa-4762-85d2-d5e28bf8c3f5	POS-001-20260519-0001	2026-05-19 07:22:31.091	59413a53-01e8-4c7f-ada6-03facf44376d	Final Test	\N	\N	250000	0	250000	PAID	\N	2026-05-19 07:22:31.105	\N	f	\N	\N
a14235fa-2230-4867-bee3-74b01e8a61cd	POS-001-20260519-0002	2026-05-19 07:22:41.676	59413a53-01e8-4c7f-ada6-03facf44376d	Final Test	\N	\N	250000	0	250000	PAID	\N	2026-05-19 07:22:41.681	\N	f	\N	\N
\.


--
-- Data for Name: Commission; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Commission" (id, staff_id, transaction_id, amount, calculated, created_at) FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Expense" (id, description, amount, category, expense_date, created_at) FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Payment" (id, transaction_id, method, amount, reference_no, created_at) FROM stdin;
5a0f1c2b-673d-4e80-83dc-42dbbcf46721	c2286c7f-8886-404e-ba5d-6c832f07296f	CASH	200000	\N	2026-05-18 23:00:39.278
4995a78c-620d-4eda-a032-5013e5536fdf	c2286c7f-8886-404e-ba5d-6c832f07296f	QRIS	100000	\N	2026-05-18 23:00:39.278
4c87fb52-c0ac-4174-98be-ec267a7dfb63	38ad0f62-6aaa-4762-85d2-d5e28bf8c3f5	CASH	250000	\N	2026-05-19 07:22:31.105
e8b71656-b807-4c6c-8548-86b77ad25230	a14235fa-2230-4867-bee3-74b01e8a61cd	CASH	250000	\N	2026-05-19 07:22:41.681
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Product" (id, name, category, sku, cost_price, selling_price, stock_qty, min_stock, unit, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."Setting" (id, key, value) FROM stdin;
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."StockMovement" (id, product_id, type, qty, note, created_at) FROM stdin;
\.


--
-- Data for Name: TransactionItem; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."TransactionItem" (id, transaction_id, item_type, item_name, qty, unit_price, discount, line_total, staff_id, staff_name) FROM stdin;
7b0f3f6d-fb47-4f14-bfbe-7c6c48a9865d	c2286c7f-8886-404e-ba5d-6c832f07296f	service	Classic Lash Extension	1	250000	0	250000	\N	Rina
c7dbf3e0-cb25-41d1-8102-2a0959fccb50	c2286c7f-8886-404e-ba5d-6c832f07296f	product	Lash Shampoo	1	50000	0	50000	\N	\N
1177ca82-4028-4703-bc3b-ee6e7dff6eca	38ad0f62-6aaa-4762-85d2-d5e28bf8c3f5	service	Classic Lash Ext	1	250000	0	250000	\N	Rina
91feba94-0842-46cd-86fb-23442bb80119	a14235fa-2230-4867-bee3-74b01e8a61cd	service	Classic Lash Ext	1	250000	0	250000	\N	Rina
\.


--
-- Data for Name: TreatmentRecord; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."TreatmentRecord" (id, transaction_id, customer_name, therapist_name, services, therapist_notes, before_photos, after_photos, status, started_at, completed_at, created_at, updated_at, code) FROM stdin;
8e45b865-2ad5-46a6-a408-d2ac5657db09	38ad0f62-6aaa-4762-85d2-d5e28bf8c3f5	Final Test	Rina	{"Classic Lash Ext"}	\N	\N	\N	PENDING	\N	\N	2026-05-19 07:22:31.163	2026-05-19 07:22:31.163	TRM-001-20260519-0001
66ebfdeb-93a7-4bbe-a2a7-8961a75be427	a14235fa-2230-4867-bee3-74b01e8a61cd	Final Test	Rina	{"Classic Lash Ext"}	\N	\N	\N	PENDING	\N	\N	2026-05-19 07:22:41.691	2026-05-19 07:22:41.691	TRM-001-20260519-0002
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public."User" (id, username, password, role, active, created_at, updated_at) FROM stdin;
5c4be5e5-aac1-4c4d-aca3-e707fff275f3	admin	$2b$12$wY8nx9Dc2W7hfwblaFWVqO/qhLbchO9qGDsrB0J5iNC/l/eOAVByO	OWNER	t	2026-05-18 17:52:04.044	2026-05-18 17:52:04.044
\.


--
-- Data for Name: erp_master_account; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_account (id, code, name, type, parent_id, is_active, created_at, updated_at, description, level, is_system) FROM stdin;
1	1	ASET	ASSET	\N	t	2026-05-19 09:08:52.750366+00	2026-05-19 09:08:52.750366+00	Harta perusahaan	1	t
2	2	LIABILITAS	LIABILITY	\N	t	2026-05-19 09:08:52.754644+00	2026-05-19 09:08:52.754644+00	Kewajiban perusahaan	1	t
3	3	EKUITAS	EQUITY	\N	t	2026-05-19 09:08:52.763205+00	2026-05-19 09:08:52.763205+00	Modal perusahaan	1	t
4	4	PENDAPATAN	REVENUE	\N	t	2026-05-19 09:08:52.765447+00	2026-05-19 09:08:52.765447+00	Penghasilan perusahaan	1	t
5	5	BEBAN	EXPENSE	\N	t	2026-05-19 09:08:52.766824+00	2026-05-19 09:08:52.766824+00	Biaya operasional perusahaan	1	t
6	1.1	ASET LANCAR	ASSET	1	t	2026-05-19 09:08:52.768386+00	2026-05-19 09:08:52.768386+00	Harta lancar < 1 tahun	2	t
7	1.2	ASET TETAP	ASSET	1	t	2026-05-19 09:08:52.770833+00	2026-05-19 09:08:52.770833+00	Harta tetap > 1 tahun	2	t
8	2.1	KEWAJIBAN JANGKA PENDEK	LIABILITY	2	t	2026-05-19 09:08:52.773361+00	2026-05-19 09:08:52.773361+00	Hutang < 1 tahun	2	t
9	3.1	MODAL	EQUITY	3	t	2026-05-19 09:08:52.776879+00	2026-05-19 09:08:52.776879+00	Setoran modal dan laba	2	t
10	4.1	PENDAPATAN USAHA	REVENUE	4	t	2026-05-19 09:08:52.785062+00	2026-05-19 09:08:52.785062+00	Pendapatan dari kegiatan utama	2	t
11	5.1	BEBAN OPERASIONAL	EXPENSE	5	t	2026-05-19 09:08:52.790208+00	2026-05-19 09:08:52.790208+00	Beban untuk kegiatan operasional	2	t
12	5.2	BEBAN NON-OPERASIONAL	EXPENSE	5	t	2026-05-19 09:08:52.795441+00	2026-05-19 09:08:52.795441+00	Beban di luar operasional	2	t
14	1-120	Bank	ASSET	6	t	2026-05-19 09:08:52.807834+00	2026-05-19 09:08:52.807834+00	Saldo rekening bank	3	f
15	1-130	Piutang Usaha	ASSET	6	t	2026-05-19 09:08:52.815017+00	2026-05-19 09:08:52.815017+00	Tagihan ke pelanggan	3	f
16	1-140	Perlengkapan Salon	ASSET	6	t	2026-05-19 09:08:52.822438+00	2026-05-19 09:08:52.822438+00	Stok bulu mata, lem, serum	3	f
17	1-150	Peralatan	ASSET	7	t	2026-05-19 09:08:52.826652+00	2026-05-19 09:08:52.826652+00	Bed, kursi, lamp, alat treatment	3	f
18	1-160	Akumulasi Penyusutan	ASSET	7	t	2026-05-19 09:08:52.829487+00	2026-05-19 09:08:52.829487+00	Akumulasi penyusutan peralatan	3	f
19	2-110	Hutang Usaha	LIABILITY	8	t	2026-05-19 09:08:52.83759+00	2026-05-19 09:08:52.83759+00	Hutang ke supplier	3	f
20	2-120	Hutang Gaji	LIABILITY	8	t	2026-05-19 09:08:52.840773+00	2026-05-19 09:08:52.840773+00	Gaji terutang ke staff	3	f
21	2-130	Hutang Lain-lain	LIABILITY	8	t	2026-05-19 09:08:52.860635+00	2026-05-19 09:08:52.860635+00	Hutang non-operasional	3	f
22	3-110	Modal Pemilik	EQUITY	9	t	2026-05-19 09:08:52.862896+00	2026-05-19 09:08:52.862896+00	Setoran modal pemilik	3	f
23	3-120	Prive	EQUITY	9	t	2026-05-19 09:08:52.865594+00	2026-05-19 09:08:52.865594+00	Penarikan pribadi pemilik	3	f
24	3-130	Laba Ditahan	EQUITY	9	t	2026-05-19 09:08:52.867594+00	2026-05-19 09:08:52.867594+00	Akumulasi laba yang ditahan	3	f
25	4-100	Pendapatan Jasa	REVENUE	10	t	2026-05-19 09:08:52.872503+00	2026-05-19 09:08:52.872503+00	Pendapatan dari jasa lash extension, refill	3	f
26	4-200	Pendapatan Produk	REVENUE	10	t	2026-05-19 09:08:52.87353+00	2026-05-19 09:08:52.87353+00	Pendapatan penjualan retail produk	3	f
27	5-100	Beban Gaji	EXPENSE	11	t	2026-05-19 09:08:52.874383+00	2026-05-19 09:08:52.874383+00	Gaji staff dan therapist	3	f
28	5-110	Beban Sewa	EXPENSE	11	t	2026-05-19 09:08:52.877147+00	2026-05-19 09:08:52.877147+00	Sewa tempat / booth salon	3	f
29	5-120	Beban Listrik & Internet	EXPENSE	11	t	2026-05-19 09:08:52.877627+00	2026-05-19 09:08:52.877627+00	Tagihan listrik & internet	3	f
30	5-130	Beban Perlengkapan	EXPENSE	11	t	2026-05-19 09:08:52.882574+00	2026-05-19 09:08:52.882574+00	Pembelian bulu mata, lem, dll	3	f
31	5-140	Beban Promosi	EXPENSE	11	t	2026-05-19 09:08:52.883269+00	2026-05-19 09:08:52.883269+00	Biaya iklan	3	f
32	5-150	Beban Lain-lain	EXPENSE	12	t	2026-05-19 09:08:52.886096+00	2026-05-19 09:08:52.886096+00	Biaya operasional lainnya	3	f
13	1-110	Kas	ASSET	6	t	2026-05-19 09:08:52.805775+00	2026-05-19 09:17:58.156491+00	Uang tunai - edited	3	f
\.


--
-- Data for Name: erp_account_mapping; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_account_mapping (id, transaction_type, account_id, debit_or_credit, priority, is_active, created_at, updated_at) FROM stdin;
2	SALE	25	CREDIT	20	t	2026-05-19 09:08:52.920348	2026-05-19 09:08:52.920348
5	SALE	26	CREDIT	30	t	2026-05-19 18:27:39.838081	2026-05-19 18:27:39.838081
6	PURCHASE	16	DEBIT	10	t	2026-05-19 18:27:39.851479	2026-05-19 18:27:39.851479
7	PURCHASE	19	CREDIT	20	t	2026-05-19 18:27:39.86576	2026-05-19 18:27:39.86576
8	EXPENSE	27	DEBIT	10	t	2026-05-19 18:27:39.877207	2026-05-19 18:27:39.877207
9	EXPENSE	13	CREDIT	20	t	2026-05-19 18:27:39.889855	2026-05-19 18:27:39.889855
10	RECEIPT	13	DEBIT	10	t	2026-05-19 18:27:39.901235	2026-05-19 18:27:39.901235
11	RECEIPT	15	CREDIT	20	t	2026-05-19 18:27:39.912121	2026-05-19 18:27:39.912121
12	PAYMENT	19	DEBIT	10	t	2026-05-19 18:27:39.926799	2026-05-19 18:27:39.926799
13	PAYMENT	13	CREDIT	20	t	2026-05-19 18:27:39.939636	2026-05-19 18:27:39.939636
14	ADJUSTMENT	13	DEBIT	10	t	2026-05-19 18:27:39.953537	2026-05-19 18:27:39.953537
15	ADJUSTMENT	24	CREDIT	20	t	2026-05-19 18:27:39.965003	2026-05-19 18:27:39.965003
1	SALE	13	DEBIT	10	f	2026-05-19 09:08:52.902016	2026-05-19 18:27:45.825203
3	SALE	13	DEBIT	10	f	2026-05-19 18:27:39.809657	2026-05-19 18:27:45.837318
4	SALE	25	CREDIT	20	f	2026-05-19 18:27:39.825368	2026-05-19 18:27:45.847574
16	SALE	13	DEBIT	10	t	2026-05-19 18:28:02.652622	2026-05-19 18:28:02.652622
\.


--
-- Data for Name: erp_financial_period; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_financial_period (id, code, name, start_date, end_date, is_locked, locked_at, locked_by, is_closed, closed_at, closed_by, created_at, updated_at) FROM stdin;
1	2026-05	May 2026	2026-05-01	2026-05-28	f	\N	\N	f	\N	\N	2026-05-19 08:05:20.091774+00	2026-05-19 08:05:20.091774+00
\.


--
-- Data for Name: erp_master_branch; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_branch (id, code, name, address, phone, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_fixed_asset; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_fixed_asset (id, asset_code, name, category, purchase_date, purchase_price, useful_life_years, residual_value, depreciation_method, accumulated_depreciation, book_value, status, disposed_at, disposal_price, branch_id, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_posting_transaction; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_posting_transaction (id, doc_number, transaction_type, ref_table, ref_id, total_amount, status, period_id, posted_at, posted_by, notes, transaction_date, created_at, updated_at) FROM stdin;
1	POS-MAIN-20260519-0002	SALE	erp_pos_transaction_sync	3	200000	DRAFT	1	\N	\N	Auto-journal from POS: POS-001-20260519-T003	2026-05-19	2026-05-19 09:17:58.412418+00	2026-05-19 09:17:58.412418+00
2	POS-MAIN-20260519-0003	SALE	erp_pos_transaction_sync	4	200000	DRAFT	1	\N	\N	Auto-journal from POS: POS-001-20260519-T004	2026-05-19	2026-05-19 09:18:07.013008+00	2026-05-19 09:18:07.013008+00
3	POS-MAIN-20260519-0004	SALE	erp_pos_transaction_sync	5	200000	DRAFT	1	\N	\N	Auto-journal from POS: POS-001-20260519-T005	2026-05-19	2026-05-19 09:19:03.912388+00	2026-05-19 09:19:03.912388+00
4	POS-MAIN-20260519-0005	SALE	erp_pos_transaction_sync	6	200000	DRAFT	1	\N	\N	Auto-journal from POS: POS-001-20260519-FINAL	2026-05-19	2026-05-19 09:19:53.79576+00	2026-05-19 09:19:53.79576+00
5	POS-MAIN-20260519-0006	SALE	erp_pos_transaction_sync	7	175000	POSTED	1	2026-05-19 09:24:36.798293	system	Auto-journal from POS: POS-001-20260519-FINAL2	2026-05-19	2026-05-19 09:24:36.733555+00	2026-05-19 09:24:36.77564+00
6	POS-MAIN-20260519-0007	SALE	erp_pos_transaction_sync	8	350000	POSTED	1	2026-05-19 17:50:38.980187	system	Auto-journal from POS: POS-BBO9-TEST-17ced7de	2026-05-20	2026-05-19 17:50:38.882036+00	2026-05-19 17:50:38.941343+00
7	POS-MAIN-20260519-0008	SALE	erp_pos_transaction_sync	9	350000	POSTED	1	2026-05-19 17:51:55.692716	system	Auto-journal from POS: POS-BBO9-AUTO-001	2026-05-20	2026-05-19 17:51:55.625881+00	2026-05-19 17:51:55.668043+00
8	POS-MAIN-20260519-0009	SALE	erp_pos_transaction_sync	10	225000	POSTED	1	2026-05-19 17:53:33.898966	system	Auto-journal from POS: POS-BBO9-AUTO-002	2026-05-20	2026-05-19 17:53:33.822045+00	2026-05-19 17:53:33.873428+00
9	POS-MAIN-20260519-0010	SALE	erp_pos_transaction_sync	11	175000	POSTED	1	2026-05-19 17:55:03.366485	system	Auto-journal from POS: POS-BBO9-AUTO-003	2026-05-20	2026-05-19 17:55:03.245341+00	2026-05-19 17:55:03.30363+00
10	POS-MAIN-20260519-0011	SALE	erp_pos_transaction_sync	12	175000	POSTED	1	2026-05-19 17:56:23.404964	system	Auto-journal from POS: POS-BBO9-AUTO-004	2026-05-20	2026-05-19 17:56:23.348492+00	2026-05-19 17:56:23.383119+00
11	POS-MAIN-20260519-0012	SALE	erp_pos_transaction_sync	13	350000	POSTED	1	2026-05-19 17:57:40.460009	system	Auto-journal from POS: POS-BBO9-FINAL	2026-05-20	2026-05-19 17:57:40.403789+00	2026-05-19 17:57:40.440676+00
12	POS-MAIN-20260519-0013	SALE	erp_pos_transaction_sync	14	250000	POSTED	1	2026-05-19 17:58:48.850687	system	Auto-journal from POS: POS-BBO9-CF	2026-05-20	2026-05-19 17:58:48.815571+00	2026-05-19 17:58:48.83772+00
13	POS-MAIN-20260519-0014	SALE	erp_pos_transaction_sync	15	300000	POSTED	1	2026-05-19 17:59:31.978272	system	Auto-journal from POS: POS-BBO9-CF2	2026-05-20	2026-05-19 17:59:31.947139+00	2026-05-19 17:59:31.966635+00
14	EXP-MAIN-20260520-0001	EXPENSE	\N	\N	50000	POSTED	1	2026-05-20 10:54:09.493638	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	dibayar	2026-05-20	2026-05-20 10:54:09.390441+00	2026-05-20 10:54:09.44712+00
\.


--
-- Data for Name: erp_journal_entry; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_journal_entry (id, je_number, transaction_id, transaction_type, period_id, description, status, posted_at, posted_by, entry_date, total_debit, total_credit, created_at, updated_at) FROM stdin;
5	JE-MAIN-20260519-0002	5	SALE	1	Auto-journal for POS-MAIN-20260519-0006 (SALE)	POSTED	2026-05-19 09:24:36.811129	system	2026-05-19	175000	175000	2026-05-19 09:24:36.77564+00	2026-05-19 09:24:36.77564+00
6	JE-MAIN-20260519-0003	6	SALE	1	Auto-journal for POS-MAIN-20260519-0007 (SALE)	POSTED	2026-05-19 17:50:38.993809	system	2026-05-20	350000	350000	2026-05-19 17:50:38.941343+00	2026-05-19 17:50:38.941343+00
7	JE-MAIN-20260519-0004	7	SALE	1	Auto-journal for POS-MAIN-20260519-0008 (SALE)	POSTED	2026-05-19 17:51:55.703273	system	2026-05-20	350000	350000	2026-05-19 17:51:55.668043+00	2026-05-19 17:51:55.668043+00
8	JE-MAIN-20260519-0005	8	SALE	1	Auto-journal for POS-MAIN-20260519-0009 (SALE)	POSTED	2026-05-19 17:53:33.915323	system	2026-05-20	225000	225000	2026-05-19 17:53:33.873428+00	2026-05-19 17:53:33.873428+00
9	JE-MAIN-20260519-0006	9	SALE	1	Auto-journal for POS-MAIN-20260519-0010 (SALE)	POSTED	2026-05-19 17:55:03.391339	system	2026-05-20	175000	175000	2026-05-19 17:55:03.30363+00	2026-05-19 17:55:03.30363+00
10	JE-MAIN-20260519-0007	10	SALE	1	Auto-journal for POS-MAIN-20260519-0011 (SALE)	POSTED	2026-05-19 17:56:23.415064	system	2026-05-20	175000	175000	2026-05-19 17:56:23.383119+00	2026-05-19 17:56:23.383119+00
11	JE-MAIN-20260519-0008	11	SALE	1	Auto-journal for POS-MAIN-20260519-0012 (SALE)	POSTED	2026-05-19 17:57:40.469668	system	2026-05-20	350000	350000	2026-05-19 17:57:40.440676+00	2026-05-19 17:57:40.440676+00
12	JE-MAIN-20260519-0009	12	SALE	1	Auto-journal for POS-MAIN-20260519-0013 (SALE)	POSTED	2026-05-19 17:58:48.862017	system	2026-05-20	250000	250000	2026-05-19 17:58:48.83772+00	2026-05-19 17:58:48.83772+00
13	JE-MAIN-20260519-0010	13	SALE	1	Auto-journal for POS-MAIN-20260519-0014 (SALE)	POSTED	2026-05-19 17:59:31.986847	system	2026-05-20	300000	300000	2026-05-19 17:59:31.966635+00	2026-05-19 17:59:31.966635+00
14	JE-MAIN-20260520-0001	14	EXPENSE	1	Auto-journal for EXP-MAIN-20260520-0001 (EXPENSE)	POSTED	2026-05-20 10:54:09.516318	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-20	50000	50000	2026-05-20 10:54:09.44712+00	2026-05-20 10:54:09.44712+00
\.


--
-- Data for Name: erp_asset_depreciation; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_asset_depreciation (id, asset_id, period_code, depreciation_amount, accumulated_after, book_value_after, journal_entry_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_audit_log; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_audit_log (id, table_name, record_id, action, summary, old_values, new_values, performed_by, performed_at, ip_address, branch_id, created_at, updated_at) FROM stdin;
8	erp_posting_transaction	11	POST	Posted POS-MAIN-20260519-0012 (SALE) Rp 350,000	null	{"status": "POSTED", "doc_number": "POS-MAIN-20260519-0012", "total_amount": 350000, "transaction_type": "SALE"}	system	2026-05-19 17:57:40.502942	\N	\N	2026-05-19 17:57:40.492772+00	2026-05-19 17:57:40.492772+00
9	erp_posting_transaction	12	POST	Posted POS-MAIN-20260519-0013 (SALE) Rp 250,000	null	{"status": "POSTED", "doc_number": "POS-MAIN-20260519-0013", "total_amount": 250000, "transaction_type": "SALE"}	system	2026-05-19 17:58:48.883009	\N	\N	2026-05-19 17:58:48.877854+00	2026-05-19 17:58:48.877854+00
10	erp_posting_transaction	13	POST	Posted POS-MAIN-20260519-0014 (SALE) Rp 300,000	null	{"status": "POSTED", "doc_number": "POS-MAIN-20260519-0014", "total_amount": 300000, "transaction_type": "SALE"}	system	2026-05-19 17:59:32.010398	\N	\N	2026-05-19 17:59:32.004306+00	2026-05-19 17:59:32.004306+00
11	erp_posting_transaction	14	POST	Posted EXP-MAIN-20260520-0001 (EXPENSE) Rp 50,000	null	{"status": "POSTED", "doc_number": "EXP-MAIN-20260520-0001", "total_amount": 50000, "transaction_type": "EXPENSE"}	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-20 10:54:09.566256	\N	\N	2026-05-20 10:54:09.557147+00	2026-05-20 10:54:09.557147+00
\.


--
-- Data for Name: erp_bank_account; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_bank_account (id, account_name, bank_name, account_number, account_type, currency, opening_balance, current_balance, branch_id, is_active, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_bank_transaction; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_bank_transaction (id, bank_account_id, transaction_type, amount, transaction_date, description, ref_table, ref_id, transfer_to_account_id, is_reconciled, reconciled_at, balance_before, balance_after, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_master_product; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_product (id, name, category, sub_category, unit, sku, cost_price, selling_price, min_stock, is_active, created_at, updated_at) FROM stdin;
1	Lash Glue Premium	Consumable	Lash	pcs	LGP-001	25000	50000	5	t	2026-05-19 12:20:36.600842+00	2026-05-19 12:20:36.600842+00
2	BBO7 QA Lash Serum	Retail	\N	pcs	BBO7-QA-LASH	50000	125000	2	t	2026-05-19 12:52:48.73266+00	2026-05-19 12:52:48.73266+00
\.


--
-- Data for Name: erp_bill_of_material; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_bill_of_material (id, code, name, service_id, total_standard_cost, is_active, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_bom_component; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_bom_component (id, bom_id, line_no, product_id, quantity, unit_cost, subtotal, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_booking_record; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_booking_record (id, code, customer_name, customer_phone, services, service_names, therapist_name, assigned_bed, booking_date, estimated_duration, status, checked_in_at, completed_at, transaction_id, total_price, notes, created_at, updated_at) FROM stdin;
1	BOOK-001-20260519-0001	Siti Nurhaliza	08111111111	[{"name": "Classic Lash Extension", "price": 175000}, {"name": "Brow Shaping", "price": 35000}]	Classic Lash Extension, Brow Shaping	Rina	Bed 2	2026-05-20 03:00:00+00	120	DONE	2026-05-19 20:38:24.833378+00	2026-05-19 20:38:24.966243+00	TRX-001-20260519-0004	210000	\N	2026-05-19 20:38:18.077795+00	2026-05-19 20:38:24.96417+00
4	BOOK-001-20260521-0003	MILAMILO	081267948187	[]		Gends	K02	2026-05-22 18:56:00+00	60	DONE	\N	2026-05-21 08:51:00.46421+00	\N	0	\N	2026-05-21 05:56:31.737355+00	2026-05-21 08:51:00.462905+00
3	BOOK-001-20260521-0002	haheuab	0821349181	[]		Gends	K02	2026-05-22 12:46:00+00	60	DONE	\N	2026-05-21 08:51:01.463357+00	\N	0	\N	2026-05-21 05:46:53.517342+00	2026-05-21 08:51:01.460102+00
2	BOOK-001-20260521-0001	hevabrbe	081546401	[]		Gends	K02	2026-05-22 12:18:00+00	60	DONE	\N	2026-05-21 08:51:02.274938+00	\N	0	\N	2026-05-21 05:18:29.543552+00	2026-05-21 08:51:02.272978+00
5	BOOK-001-20260521-0004	FYK Mila	08223812763	[]		Gends	K02	2026-05-22 18:51:00+00	60	BOOKED	\N	\N	\N	0	\N	2026-05-21 12:52:42.254123+00	2026-05-21 12:52:42.254123+00
\.


--
-- Data for Name: erp_document_registry; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_document_registry (id, doc_key, module, branch, doc_date, seq, ref_table, ref_id, status, notes, created_at, updated_at) FROM stdin;
1	POS-BSD-20260519-0001	POS	BSD	2026-05-19	1	erp_pos_transaction_sync	1	ACTIVE	POS Transaction: POS-001-20260519-9999	2026-05-19 07:24:17.879149+00	2026-05-19 07:24:17.879149+00
2	POS-BSD-20260519-0002	POS	BSD	2026-05-19	2	erp_pos_transaction_sync	2	ACTIVE	POS Transaction: POS-001-20260519-T002	2026-05-19 08:05:20.066235+00	2026-05-19 08:05:20.066235+00
3	POS-MAIN-20260519-0001	POS	MAIN	2026-05-19	1	\N	\N	ACTIVE	\N	2026-05-19 08:05:20.091774+00	2026-05-19 08:05:20.091774+00
4	JE-MAIN-20260519-0001	JE	MAIN	2026-05-19	1	\N	\N	ACTIVE	\N	2026-05-19 08:05:20.159052+00	2026-05-19 08:05:20.159052+00
5	POS-BSD-20260519-0003	POS	BSD	2026-05-19	3	erp_pos_transaction_sync	3	ACTIVE	POS Transaction: POS-001-20260519-T003	2026-05-19 09:17:58.391378+00	2026-05-19 09:17:58.391378+00
6	POS-MAIN-20260519-0002	POS	MAIN	2026-05-19	2	\N	\N	ACTIVE	\N	2026-05-19 09:17:58.412418+00	2026-05-19 09:17:58.412418+00
8	POS-BSD-20260519-0004	POS	BSD	2026-05-19	4	erp_pos_transaction_sync	4	ACTIVE	POS Transaction: POS-001-20260519-T004	2026-05-19 09:18:06.999959+00	2026-05-19 09:18:06.999959+00
9	POS-MAIN-20260519-0003	POS	MAIN	2026-05-19	3	\N	\N	ACTIVE	\N	2026-05-19 09:18:07.013008+00	2026-05-19 09:18:07.013008+00
11	POS-BSD-20260519-0005	POS	BSD	2026-05-19	5	erp_pos_transaction_sync	5	ACTIVE	POS Transaction: POS-001-20260519-T005	2026-05-19 09:19:03.897787+00	2026-05-19 09:19:03.897787+00
12	POS-MAIN-20260519-0004	POS	MAIN	2026-05-19	4	\N	\N	ACTIVE	\N	2026-05-19 09:19:03.912388+00	2026-05-19 09:19:03.912388+00
14	POS-BSD-20260519-0006	POS	BSD	2026-05-19	6	erp_pos_transaction_sync	6	ACTIVE	POS Transaction: POS-001-20260519-FINAL	2026-05-19 09:19:53.785072+00	2026-05-19 09:19:53.785072+00
15	POS-MAIN-20260519-0005	POS	MAIN	2026-05-19	5	\N	\N	ACTIVE	\N	2026-05-19 09:19:53.79576+00	2026-05-19 09:19:53.79576+00
17	POS-BSD-20260519-0007	POS	BSD	2026-05-19	7	erp_pos_transaction_sync	7	ACTIVE	POS Transaction: POS-001-20260519-FINAL2	2026-05-19 09:24:36.698922+00	2026-05-19 09:24:36.698922+00
18	POS-MAIN-20260519-0006	POS	MAIN	2026-05-19	6	\N	\N	ACTIVE	\N	2026-05-19 09:24:36.733555+00	2026-05-19 09:24:36.733555+00
19	JE-MAIN-20260519-0002	JE	MAIN	2026-05-19	2	\N	\N	ACTIVE	\N	2026-05-19 09:24:36.77564+00	2026-05-19 09:24:36.77564+00
20	POS-BSD-20260519-0008	POS	BSD	2026-05-19	8	erp_pos_transaction_sync	8	ACTIVE	POS Transaction: POS-BBO9-TEST-17ced7de	2026-05-19 17:50:38.836086+00	2026-05-19 17:50:38.836086+00
21	POS-MAIN-20260519-0007	POS	MAIN	2026-05-19	7	\N	\N	ACTIVE	\N	2026-05-19 17:50:38.882036+00	2026-05-19 17:50:38.882036+00
22	JE-MAIN-20260519-0003	JE	MAIN	2026-05-19	3	\N	\N	ACTIVE	\N	2026-05-19 17:50:38.941343+00	2026-05-19 17:50:38.941343+00
23	POS-BSD-20260519-0009	POS	BSD	2026-05-19	9	erp_pos_transaction_sync	9	ACTIVE	POS Transaction: POS-BBO9-AUTO-001	2026-05-19 17:51:55.592645+00	2026-05-19 17:51:55.592645+00
24	POS-MAIN-20260519-0008	POS	MAIN	2026-05-19	8	\N	\N	ACTIVE	\N	2026-05-19 17:51:55.625881+00	2026-05-19 17:51:55.625881+00
25	JE-MAIN-20260519-0004	JE	MAIN	2026-05-19	4	\N	\N	ACTIVE	\N	2026-05-19 17:51:55.668043+00	2026-05-19 17:51:55.668043+00
26	POS-BSD-20260519-0010	POS	BSD	2026-05-19	10	erp_pos_transaction_sync	10	ACTIVE	POS Transaction: POS-BBO9-AUTO-002	2026-05-19 17:53:33.778981+00	2026-05-19 17:53:33.778981+00
27	POS-MAIN-20260519-0009	POS	MAIN	2026-05-19	9	\N	\N	ACTIVE	\N	2026-05-19 17:53:33.822045+00	2026-05-19 17:53:33.822045+00
28	JE-MAIN-20260519-0005	JE	MAIN	2026-05-19	5	\N	\N	ACTIVE	\N	2026-05-19 17:53:33.873428+00	2026-05-19 17:53:33.873428+00
29	POS-BSD-20260519-0011	POS	BSD	2026-05-19	11	erp_pos_transaction_sync	11	ACTIVE	POS Transaction: POS-BBO9-AUTO-003	2026-05-19 17:55:03.205397+00	2026-05-19 17:55:03.205397+00
30	POS-MAIN-20260519-0010	POS	MAIN	2026-05-19	10	\N	\N	ACTIVE	\N	2026-05-19 17:55:03.245341+00	2026-05-19 17:55:03.245341+00
31	JE-MAIN-20260519-0006	JE	MAIN	2026-05-19	6	\N	\N	ACTIVE	\N	2026-05-19 17:55:03.30363+00	2026-05-19 17:55:03.30363+00
32	POS-BSD-20260519-0012	POS	BSD	2026-05-19	12	erp_pos_transaction_sync	12	ACTIVE	POS Transaction: POS-BBO9-AUTO-004	2026-05-19 17:56:23.316517+00	2026-05-19 17:56:23.316517+00
33	POS-MAIN-20260519-0011	POS	MAIN	2026-05-19	11	\N	\N	ACTIVE	\N	2026-05-19 17:56:23.348492+00	2026-05-19 17:56:23.348492+00
34	JE-MAIN-20260519-0007	JE	MAIN	2026-05-19	7	\N	\N	ACTIVE	\N	2026-05-19 17:56:23.383119+00	2026-05-19 17:56:23.383119+00
35	POS-BSD-20260519-0013	POS	BSD	2026-05-19	13	erp_pos_transaction_sync	13	ACTIVE	POS Transaction: POS-BBO9-FINAL	2026-05-19 17:57:40.379209+00	2026-05-19 17:57:40.379209+00
36	POS-MAIN-20260519-0012	POS	MAIN	2026-05-19	12	\N	\N	ACTIVE	\N	2026-05-19 17:57:40.403789+00	2026-05-19 17:57:40.403789+00
37	JE-MAIN-20260519-0008	JE	MAIN	2026-05-19	8	\N	\N	ACTIVE	\N	2026-05-19 17:57:40.440676+00	2026-05-19 17:57:40.440676+00
38	POS-BSD-20260519-0014	POS	BSD	2026-05-19	14	erp_pos_transaction_sync	14	ACTIVE	POS Transaction: POS-BBO9-CF	2026-05-19 17:58:48.800408+00	2026-05-19 17:58:48.800408+00
39	POS-MAIN-20260519-0013	POS	MAIN	2026-05-19	13	\N	\N	ACTIVE	\N	2026-05-19 17:58:48.815571+00	2026-05-19 17:58:48.815571+00
40	JE-MAIN-20260519-0009	JE	MAIN	2026-05-19	9	\N	\N	ACTIVE	\N	2026-05-19 17:58:48.83772+00	2026-05-19 17:58:48.83772+00
41	POS-BSD-20260519-0015	POS	BSD	2026-05-19	15	erp_pos_transaction_sync	15	ACTIVE	POS Transaction: POS-BBO9-CF2	2026-05-19 17:59:31.933703+00	2026-05-19 17:59:31.933703+00
42	POS-MAIN-20260519-0014	POS	MAIN	2026-05-19	14	\N	\N	ACTIVE	\N	2026-05-19 17:59:31.947139+00	2026-05-19 17:59:31.947139+00
43	JE-MAIN-20260519-0010	JE	MAIN	2026-05-19	10	\N	\N	ACTIVE	\N	2026-05-19 17:59:31.966635+00	2026-05-19 17:59:31.966635+00
44	EXP-MAIN-20260520-0001	EXP	MAIN	2026-05-20	1	\N	\N	ACTIVE	\N	2026-05-20 10:54:09.390441+00	2026-05-20 10:54:09.390441+00
45	JE-MAIN-20260520-0001	JE	MAIN	2026-05-20	1	\N	\N	ACTIVE	\N	2026-05-20 10:54:09.44712+00	2026-05-20 10:54:09.44712+00
\.


--
-- Data for Name: erp_doc_cross_reference; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_doc_cross_reference (id, source_doc_key, target_doc_key, relation_type, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_doc_sequence; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_doc_sequence (id, module, branch, date_key, seq, created_at, updated_at) FROM stdin;
1	POS	BSD	20260519	15	2026-05-19 07:24:17.879149+00	2026-05-19 17:59:31.933703+00
2	POS	MAIN	20260519	14	2026-05-19 08:05:20.091774+00	2026-05-19 17:59:31.947139+00
3	JE	MAIN	20260519	10	2026-05-19 08:05:20.159052+00	2026-05-19 17:59:31.966635+00
4	EXP	MAIN	20260520	1	2026-05-20 10:54:09.390441+00	2026-05-20 10:54:09.390441+00
5	JE	MAIN	20260520	1	2026-05-20 10:54:09.44712+00	2026-05-20 10:54:09.44712+00
\.


--
-- Data for Name: erp_journal_line; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_journal_line (id, journal_entry_id, line_no, account_id, account_code, account_name, debit_amount, credit_amount, description, created_at, updated_at) FROM stdin;
1	5	1	13	1-110	Kas	175000	0	SALE - POS-MAIN-20260519-0006	2026-05-19 09:24:36.77564+00	2026-05-19 09:24:36.77564+00
2	5	2	25	4-100	Pendapatan Jasa	0	175000	SALE - POS-MAIN-20260519-0006	2026-05-19 09:24:36.77564+00	2026-05-19 09:24:36.77564+00
3	6	1	13	1-110	Kas	350000	0	SALE - POS-MAIN-20260519-0007	2026-05-19 17:50:38.941343+00	2026-05-19 17:50:38.941343+00
4	6	2	25	4-100	Pendapatan Jasa	0	350000	SALE - POS-MAIN-20260519-0007	2026-05-19 17:50:38.941343+00	2026-05-19 17:50:38.941343+00
5	7	1	13	1-110	Kas	350000	0	SALE - POS-MAIN-20260519-0008	2026-05-19 17:51:55.668043+00	2026-05-19 17:51:55.668043+00
6	7	2	25	4-100	Pendapatan Jasa	0	350000	SALE - POS-MAIN-20260519-0008	2026-05-19 17:51:55.668043+00	2026-05-19 17:51:55.668043+00
7	8	1	13	1-110	Kas	225000	0	SALE - POS-MAIN-20260519-0009	2026-05-19 17:53:33.873428+00	2026-05-19 17:53:33.873428+00
8	8	2	25	4-100	Pendapatan Jasa	0	225000	SALE - POS-MAIN-20260519-0009	2026-05-19 17:53:33.873428+00	2026-05-19 17:53:33.873428+00
9	9	1	13	1-110	Kas	175000	0	SALE - POS-MAIN-20260519-0010	2026-05-19 17:55:03.30363+00	2026-05-19 17:55:03.30363+00
10	9	2	25	4-100	Pendapatan Jasa	0	175000	SALE - POS-MAIN-20260519-0010	2026-05-19 17:55:03.30363+00	2026-05-19 17:55:03.30363+00
11	10	1	13	1-110	Kas	175000	0	SALE - POS-MAIN-20260519-0011	2026-05-19 17:56:23.383119+00	2026-05-19 17:56:23.383119+00
12	10	2	25	4-100	Pendapatan Jasa	0	175000	SALE - POS-MAIN-20260519-0011	2026-05-19 17:56:23.383119+00	2026-05-19 17:56:23.383119+00
13	11	1	13	1-110	Kas	350000	0	SALE - POS-MAIN-20260519-0012	2026-05-19 17:57:40.440676+00	2026-05-19 17:57:40.440676+00
14	11	2	25	4-100	Pendapatan Jasa	0	350000	SALE - POS-MAIN-20260519-0012	2026-05-19 17:57:40.440676+00	2026-05-19 17:57:40.440676+00
15	12	1	13	1-110	Kas	250000	0	SALE - POS-MAIN-20260519-0013	2026-05-19 17:58:48.83772+00	2026-05-19 17:58:48.83772+00
16	12	2	25	4-100	Pendapatan Jasa	0	250000	SALE - POS-MAIN-20260519-0013	2026-05-19 17:58:48.83772+00	2026-05-19 17:58:48.83772+00
17	13	1	13	1-110	Kas	300000	0	SALE - POS-MAIN-20260519-0014	2026-05-19 17:59:31.966635+00	2026-05-19 17:59:31.966635+00
18	13	2	25	4-100	Pendapatan Jasa	0	300000	SALE - POS-MAIN-20260519-0014	2026-05-19 17:59:31.966635+00	2026-05-19 17:59:31.966635+00
19	14	1	27	5-100	Beban Gaji	50000	0	EXPENSE - EXP-MAIN-20260520-0001	2026-05-20 10:54:09.44712+00	2026-05-20 10:54:09.44712+00
20	14	2	13	1-110	Kas	0	50000	EXPENSE - EXP-MAIN-20260520-0001	2026-05-20 10:54:09.44712+00	2026-05-20 10:54:09.44712+00
\.


--
-- Data for Name: erp_master_bed; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_bed (id, code, name, section, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_master_category; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_category (id, name, type, parent_id, sort_order, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_master_company; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_company (id, name, address, phone, email, tax_id, logo_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_master_customer; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_customer (id, name, phone, email, address, notes, total_visits, is_active, created_at, updated_at) FROM stdin;
1	Dipa Maginov	081234567890	dipa@example.com	Jakarta	VIP customer	3	t	2026-05-19 11:57:03.806758+00	2026-05-19 11:57:03.806758+00
2	Ayu Lestari	082233445566	ayu@example.com	Depok	Lash extension regular	5	t	2026-05-19 11:57:03.850494+00	2026-05-19 11:57:03.850494+00
3	Maya Putri	087788990011	maya@example.com	Bekasi	Brow treatment	2	t	2026-05-19 11:57:03.913961+00	2026-05-19 11:57:03.913961+00
4	BBO7 QA Customer	081200000007	bbo7.qa@example.com	\N	\N	0	t	2026-05-19 12:52:48.750364+00	2026-05-19 12:52:48.750364+00
7	BBO9 Test	\N	\N	\N	\N	0	t	2026-05-19 17:52:33.282811+00	2026-05-19 17:52:33.282811+00
9	BBO9 Test Customer	\N	\N	\N	\N	0	t	2026-05-19 17:53:53.12911+00	2026-05-19 17:53:53.12911+00
11	Final Test	\N	\N	\N	\N	0	t	2026-05-19 17:57:40.492772+00	2026-05-19 17:57:40.492772+00
12	Cloudflare Test	\N	\N	\N	\N	0	t	2026-05-19 17:58:48.877854+00	2026-05-19 17:58:48.877854+00
13	CF Test 2	\N	\N	\N	\N	0	t	2026-05-19 17:59:32.004306+00	2026-05-19 17:59:32.004306+00
\.


--
-- Data for Name: erp_master_service; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_service (id, name, description, category, duration, price, is_active, created_at, updated_at) FROM stdin;
3	Volume Lash Extension	\N	Lash	120	200000	t	2026-05-19 10:05:49.373356+00	2026-05-19 10:05:49.373356+00
4	Brow Lamination	\N	Brow	60	100000	t	2026-05-19 10:05:49.454822+00	2026-05-19 10:05:49.454822+00
5	Eyebrow Tinting	\N	Brow	30	50000	t	2026-05-19 10:05:49.528577+00	2026-05-19 10:05:49.528577+00
6	Brow Shaping	\N	Brow	20	35000	t	2026-05-19 10:05:49.603317+00	2026-05-19 10:05:49.603317+00
7	Facial Basic	\N	Facial	60	80000	t	2026-05-19 10:05:49.682951+00	2026-05-19 10:05:49.682951+00
8	Facial Gold	\N	Facial	75	150000	t	2026-05-19 10:05:49.762616+00	2026-05-19 10:05:49.762616+00
9	Eyelash Removal	\N	Lash	15	30000	t	2026-05-19 10:05:49.835892+00	2026-05-19 10:05:49.835892+00
10	Test Service	\N	Test	30	50000	f	2026-05-19 10:06:04.22433+00	2026-05-19 10:08:51.8344+00
11	Classic Lash Extension	\N	Lash	90	150000	f	2026-05-19 10:08:27.70774+00	2026-05-19 10:08:51.862574+00
12	Volume Lash Extension	\N	Lash	120	200000	f	2026-05-19 10:08:37.770979+00	2026-05-19 10:08:51.885616+00
13	Brow Lamination	\N	Brow	60	100000	f	2026-05-19 10:08:37.885429+00	2026-05-19 10:08:51.910247+00
14	Eyebrow Tinting	\N	Brow	30	50000	f	2026-05-19 10:08:38.032559+00	2026-05-19 10:08:51.934988+00
15	Brow Shaping	\N	Brow	20	35000	f	2026-05-19 10:08:38.136291+00	2026-05-19 10:08:51.958519+00
16	Facial Basic	\N	Facial	60	80000	f	2026-05-19 10:08:38.222398+00	2026-05-19 10:08:51.982103+00
17	Facial Gold	\N	Facial	75	150000	f	2026-05-19 10:08:38.30079+00	2026-05-19 10:08:52.01327+00
18	Eyelash Removal	\N	Lash	15	30000	f	2026-05-19 10:08:38.376626+00	2026-05-19 10:08:52.035742+00
1	Classic Lash Extension	Classic lash extension premium	Lash	90	175000	t	2026-05-19 10:05:05.28284+00	2026-05-19 10:09:19.911452+00
2	Classic Lash Extension	\N	Lash	90	150000	f	2026-05-19 10:05:49.284585+00	2026-05-19 10:09:19.971433+00
20		\N	\N	\N	0	f	2026-05-19 10:09:59.693499+00	2026-05-19 10:10:08.495099+00
19		\N	\N	\N	0	f	2026-05-19 10:09:38.171822+00	2026-05-19 10:10:16.392486+00
\.


--
-- Data for Name: erp_master_staff; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_staff (id, staff_id, name, role, commission_type, commission_value, is_active, created_at, updated_at, kabin) FROM stdin;
1	STF-001	Gends	Therapist	FIXED	5000	t	2026-05-20 21:31:40.168552+00	2026-05-20 21:32:20.775188+00	K02
\.


--
-- Data for Name: erp_master_supplier; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_supplier (id, name, contact_person, phone, email, address, notes, is_active, created_at, updated_at) FROM stdin;
1	Lash Pro Indonesia	Nina	081111222333	sales@lashpro.id	Jakarta Barat	Supplier lash extension	t	2026-05-19 11:57:03.985238+00	2026-05-19 11:57:03.985238+00
2	Beauty Tools Supplier	Raka	082222333444	hello@beautytools.id	Tangerang	Tools dan consumables	t	2026-05-19 11:57:04.05043+00	2026-05-19 11:57:04.05043+00
3	Skincare Distributor	Sari	083333444555	order@skincare.id	Bandung	Facial products	t	2026-05-19 11:57:04.123539+00	2026-05-19 11:57:04.123539+00
\.


--
-- Data for Name: erp_master_tax; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_tax (id, name, rate, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_master_voucher; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_master_voucher (id, code, discount_type, discount_value, min_purchase, max_use, used_count, valid_from, valid_until, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_period_close_log; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_period_close_log (id, period_id, action, total_revenue, total_expenses, net_income, je_number, notes, performed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_pos_session; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_pos_session (id, code, status, opened_by, closed_by, opened_at, closed_at, opening_cash, closing_cash, expected_cash, difference, total_sales, total_transactions, notes, created_at, updated_at, total_expenses) FROM stdin;
1	SFT-001-20260519-0001	CLOSED	admin	\N	2026-05-19 18:53:13.544858+00	2026-05-19 18:53:26.024767+00	100000	100000	100000	0	0	0	\N	2026-05-19 18:53:13.544858+00	2026-05-19 18:53:26.023693+00	0
2	SFT-001-20260519-0002	CLOSED	admin	\N	2026-05-19 18:54:15.047091+00	2026-05-19 19:02:35.619864+00	100000	100000	100000	0	0	0	\N	2026-05-19 18:54:15.047091+00	2026-05-19 19:02:35.618754+00	0
3	SFT-001-20260519-0003	CLOSED	admin	\N	2026-05-19 19:03:26.359578+00	2026-05-19 19:24:18.597+00	50000	50000	50000	0	0	0	\N	2026-05-19 19:03:26.359578+00	2026-05-19 19:24:18.595285+00	0
4	SFT-001-20260519-0004	CLOSED	admin	\N	2026-05-19 19:27:40.338225+00	2026-05-19 19:35:23.438617+00	50000	50000	50000	0	0	0	\N	2026-05-19 19:27:40.338225+00	2026-05-19 19:35:23.437231+00	0
5	SFT-001-20260519-0005	CLOSED	admin	\N	2026-05-19 19:35:52.49808+00	2026-05-19 19:43:19.468462+00	100000	100000	100000	0	0	0	\N	2026-05-19 19:35:52.49808+00	2026-05-19 19:43:19.464558+00	0
6	SFT-001-20260519-0006	CLOSED	admin	\N	2026-05-19 19:44:29.736263+00	2026-05-20 09:38:01.014544+00	50000	610000	610000	0	625000	2	[PENGELUARAN] Beli air mineral: Rp 15,000\n[PENGELUARAN] Ganti uang receh: Rp 50,000	2026-05-19 19:44:29.736263+00	2026-05-20 09:38:01.010247+00	65000
7	SFT-001-20260520-0001	CLOSED	admin	\N	2026-05-20 09:38:19.179738+00	2026-05-20 10:04:15.84943+00	50000	200000	200000	0	200000	1	Total Pengeluaran: Rp 50.000	2026-05-20 09:38:19.179738+00	2026-05-20 10:04:15.847611+00	50000
8	SFT-001-20260520-0002	CLOSED	admin	\N	2026-05-20 17:02:00.335191+00	2026-05-20 21:13:08.697304+00	50000	295000	345000	-50000	295000	1	Reset - closed by admin	2026-05-20 17:02:00.335191+00	2026-05-20 21:13:08.695818+00	0
9	SFT-001-20260520-0003	CLOSED	admin	\N	2026-05-20 21:15:50.885421+00	2026-05-21 05:51:52.699884+00	50000	\N	\N	\N	0	0	\N	2026-05-20 21:15:50.885421+00	2026-05-20 21:15:50.885421+00	0
10	SFT-001-20260521-0001	CLOSED	admin	\N	2026-05-21 05:55:12.748084+00	2026-05-21 08:44:19.728276+00	50000	350000	400000	-50000	350000	2	Shit - Gends	2026-05-21 05:55:12.748084+00	2026-05-21 08:44:19.72602+00	0
11	SFT-001-20260521-0002	CLOSED	admin	\N	2026-05-21 10:27:32.491906+00	2026-05-21 10:39:48.465196+00	50000	350000	50000	300000	0	0	Tutup shift 21 Mei 2026 - revenue Rp 350.000	2026-05-21 10:27:32.491906+00	2026-05-21 10:39:48.44765+00	0
12	SFT-001-20260521-0003	CLOSED	admin	\N	2026-05-21 12:51:20.326608+00	2026-05-21 14:26:06.434719+00	50000	275000	325000	-50000	275000	1	\N	2026-05-21 12:51:20.326608+00	2026-05-21 14:26:06.432602+00	0
\.


--
-- Data for Name: erp_pos_settlement; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_pos_settlement (id, pos_session_id, session_code, opened_at, closed_at, opened_by, opening_cash, closing_cash, expected_cash, difference, total_sales, total_transactions, notes, payment_breakdown, doc_key, synced_at, created_at, updated_at, total_expenses) FROM stdin;
\.


--
-- Data for Name: erp_pos_transaction_sync; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_pos_transaction_sync (id, pos_transaction_id, code, date, customer_name, subtotal, discount, grand_total, payment_status, notes, items, payments, source, doc_key, synced_at, created_at, updated_at) FROM stdin;
1	test-001	POS-001-20260519-9999	2026-05-19 07:00:00+00	Test Auto Journal	0	0	250000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 250000, "discount": 0, "line_total": 250000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 250000, "reference_no": null}]	POS	POS-BSD-20260519-0001	2026-05-19 07:24:17.714669+00	2026-05-19 07:24:17.879149+00	2026-05-19 07:24:17.879149+00
2	test-coa-002	POS-001-20260519-T002	2026-05-19 10:00:00+00	Test COA SAK EMKM	150000	0	150000	PAID	Auto journal dengan COA real	[{"item_type": "service", "item_name": "Classic Lash Ext", "qty": 1, "unit_price": 150000, "discount": 0, "line_total": 150000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 150000, "reference_no": null}]	POS	POS-BSD-20260519-0002	2026-05-19 08:05:20.05989+00	2026-05-19 08:05:20.066235+00	2026-05-19 08:05:20.066235+00
3	test-4lvl-001	POS-001-20260519-T003	2026-05-19 14:00:00+00	Test 4-Level COA	200000	0	200000	PAID	Test COA 4 level architecture	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS	POS-BSD-20260519-0003	2026-05-19 09:17:58.387453+00	2026-05-19 09:17:58.391378+00	2026-05-19 09:17:58.391378+00
4	test-4lvl-002	POS-001-20260519-T004	2026-05-19 14:00:00+00	Test 4-Level	200000	0	200000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS	POS-BSD-20260519-0004	2026-05-19 09:18:06.997764+00	2026-05-19 09:18:06.999959+00	2026-05-19 09:18:06.999959+00
5	test-4lvl-003	POS-001-20260519-T005	2026-05-19 14:00:00+00	Final Test	200000	0	200000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS	POS-BSD-20260519-0005	2026-05-19 09:19:03.895692+00	2026-05-19 09:19:03.897787+00	2026-05-19 09:19:03.897787+00
6	test-4lvl-final	POS-001-20260519-FINAL	2026-05-19 14:00:00+00	Final 4-Level	200000	0	200000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS	POS-BSD-20260519-0006	2026-05-19 09:19:53.783181+00	2026-05-19 09:19:53.785072+00	2026-05-19 09:19:53.785072+00
7	test-clear-001	POS-001-20260519-FINAL2	2026-05-19 14:00:00+00	After Cache Clear	175000	0	175000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 175000, "reference_no": null}]	POS	POS-BSD-20260519-0007	2026-05-19 09:24:36.52134+00	2026-05-19 09:24:36.698922+00	2026-05-19 09:24:36.698922+00
8	17ced7de-d98f-4121-877d-c96f407aecf7	POS-BBO9-TEST-17ced7de	2026-05-20 10:00:00+00	BBO9 Test Walk-in	350000	0	350000	PAID	BBO-9 automated test	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 2, "unit_price": 175000, "discount": 0, "line_total": 350000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 350000, "reference_no": null}]	POS	POS-BSD-20260519-0008	2026-05-19 17:50:38.438552+00	2026-05-19 17:50:38.836086+00	2026-05-19 17:50:38.836086+00
9	bbo9-test-sync-001	POS-BBO9-AUTO-001	2026-05-20 10:00:00+00	BBO9 Test	350000	0	350000	PAID	BBO-9 auto SO creation test	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 350000, "reference_no": null}]	POS	POS-BSD-20260519-0009	2026-05-19 17:51:55.277169+00	2026-05-19 17:51:55.592645+00	2026-05-19 17:51:55.592645+00
10	bbo9-test-sync-002	POS-BBO9-AUTO-002	2026-05-20 11:00:00+00	BBO9 Test Customer	250000	25000	225000	PAID	BBO-9 SO auto test	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 2, "unit_price": 125000, "discount": 0, "line_total": 250000, "staff_id": null, "staff_name": null}]	[{"method": "QRIS", "amount": 225000, "reference_no": null}]	POS	POS-BSD-20260519-0010	2026-05-19 17:53:33.461611+00	2026-05-19 17:53:33.778981+00	2026-05-19 17:53:33.778981+00
11	bbo9-test-sync-003	POS-BBO9-AUTO-003	2026-05-20 12:00:00+00	BBO9 Test	175000	0	175000	PAID	BBO-9 debug test	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 175000, "reference_no": null}]	POS	POS-BSD-20260519-0011	2026-05-19 17:55:02.823659+00	2026-05-19 17:55:03.205397+00	2026-05-19 17:55:03.205397+00
12	bbo9-test-sync-004	POS-BBO9-AUTO-004	2026-05-20 13:00:00+00	BBO9 Debug	175000	0	175000	PAID	debug test 4	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 175000, "reference_no": null}]	POS	POS-BSD-20260519-0012	2026-05-19 17:56:23.006144+00	2026-05-19 17:56:23.316517+00	2026-05-19 17:56:23.316517+00
13	bbo9-final-test	POS-BBO9-FINAL	2026-05-20 14:00:00+00	Final Test	350000	0	350000	PAID	BBO-9 final test	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 350000, "reference_no": null}]	POS	POS-BSD-20260519-0013	2026-05-19 17:57:40.374175+00	2026-05-19 17:57:40.379209+00	2026-05-19 17:57:40.379209+00
14	bbo9-cf-test	POS-BBO9-CF	2026-05-20 15:00:00+00	Cloudflare Test	250000	0	250000	PAID	\N	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 250000, "discount": 0, "line_total": 250000, "staff_id": null, "staff_name": null}]	[{"method": "QRIS", "amount": 250000, "reference_no": null}]	POS	POS-BSD-20260519-0014	2026-05-19 17:58:48.797049+00	2026-05-19 17:58:48.800408+00	2026-05-19 17:58:48.800408+00
15	bbo9-cf-2	POS-BBO9-CF2	2026-05-20 16:00:00+00	CF Test 2	300000	0	300000	PAID	\N	[{"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 2, "unit_price": 150000, "discount": 0, "line_total": 300000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 300000, "reference_no": null}]	POS	POS-BSD-20260519-0015	2026-05-19 17:59:31.930202+00	2026-05-19 17:59:31.933703+00	2026-05-19 17:59:31.933703+00
16	TRX-001-20260519-0001	TRX-001-20260519-0001	2026-05-19 19:34:17.16598+00	\N	175000	0	175000	PAID	\N	[{"item_type": "service", "item_name": "Classic Lash Extension", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS_EXPO	\N	2026-05-19 19:34:17.16598+00	2026-05-19 19:34:17.430659+00	2026-05-19 19:34:17.430659+00
17	TRX-001-20260519-0002	TRX-001-20260519-0002	2026-05-19 19:45:09.96755+00	\N	375000	50000	325000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}, {"item_type": "product", "item_name": "Lash Glue Premium", "qty": 1, "unit_price": 50000, "discount": 0, "line_total": 50000, "staff_id": null, "staff_name": null}, {"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 125000, "discount": 0, "line_total": 125000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 325000, "reference_no": null}]	POS_EXPO	\N	2026-05-19 19:45:09.96755+00	2026-05-19 19:45:09.970658+00	2026-05-19 19:45:09.970658+00
18	TRX-001-20260519-0003	TRX-001-20260519-0003	2026-05-19 20:16:03.671464+00	\N	50000	0	50000	PAID	\N	[{"item_type": "service", "item_name": "Test", "qty": 1, "unit_price": 50000, "discount": 0, "line_total": 50000, "staff_id": null, "staff_name": null}]	[{"method": "Tunai", "amount": 50000, "reference_no": null}]	POS_EXPO	\N	2026-05-19 20:16:03.671464+00	2026-05-19 20:16:03.676374+00	2026-05-19 20:16:03.676374+00
19	TRX-001-20260519-0004	TRX-001-20260519-0004	2026-05-19 20:38:24.833378+00	Siti Nurhaliza	210000	0	210000	UNPAID	Booking check-in: BOOK-001-20260519-0001	[{"item_type": "service", "item_name": "Classic Lash Extension", "qty": 1, "unit_price": 175000, "discount": 0, "line_total": 175000, "staff_id": null, "staff_name": "Rina"}, {"item_type": "service", "item_name": "Brow Shaping", "qty": 1, "unit_price": 35000, "discount": 0, "line_total": 35000, "staff_id": null, "staff_name": "Rina"}]	[]	BOOKING	\N	2026-05-19 20:38:24.833378+00	2026-05-19 20:38:24.823861+00	2026-05-19 20:38:24.823861+00
20	TRX-001-20260520-0001	TRX-001-20260520-0001	2026-05-20 09:11:50.449591+00	Dipa Maginov	300000	0	300000	PAID	\N	[{"item_type": "service", "item_name": "Brow Lamination", "qty": 1, "unit_price": 100000, "discount": 0, "line_total": 100000, "staff_id": null, "staff_name": null}, {"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "DEBIT", "amount": 300000, "reference_no": null}]	POS_EXPO	\N	2026-05-20 09:11:50.449591+00	2026-05-20 09:11:50.455637+00	2026-05-20 09:11:50.455637+00
21	TRX-001-20260520-0002	TRX-001-20260520-0002	2026-05-20 10:00:04.105728+00	Ayu Lestari	200000	0	200000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS_EXPO	\N	2026-05-20 10:00:04.105728+00	2026-05-20 10:00:04.1186+00	2026-05-20 10:00:04.1186+00
22	TRX-001-20260520-0003	TRX-001-20260520-0003	2026-05-20 20:53:29.526807+00	\N	50000	0	50000	PAID	\N	[{"item_type": "service", "item_name": "Test Service", "qty": 1, "unit_price": 50000, "discount": 0, "line_total": 50000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 50000, "reference_no": null}]	POS_EXPO	\N	2026-05-20 20:53:29.526807+00	2026-05-20 20:53:29.535302+00	2026-05-20 20:53:29.535302+00
23	TRX-001-20260520-0004	TRX-001-20260520-0004	2026-05-20 21:07:17.882425+00	\N	345000	50000	295000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}, {"item_type": "service", "item_name": "Brow Shaping", "qty": 1, "unit_price": 35000, "discount": 0, "line_total": 35000, "staff_id": null, "staff_name": null}, {"item_type": "service", "item_name": "Eyelash Removal", "qty": 1, "unit_price": 30000, "discount": 0, "line_total": 30000, "staff_id": null, "staff_name": null}, {"item_type": "service", "item_name": "Facial Basic", "qty": 1, "unit_price": 80000, "discount": 0, "line_total": 80000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 295000, "reference_no": null}]	POS_EXPO	\N	2026-05-20 21:07:17.882425+00	2026-05-20 21:07:17.884691+00	2026-05-20 21:07:17.884691+00
24	TRX-001-20260521-0001	TRX-001-20260521-0001	2026-05-21 05:57:24.524213+00	BBO7 QA Customer	200000	50000	150000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 150000, "reference_no": null}]	POS_EXPO	\N	2026-05-21 05:57:24.524213+00	2026-05-21 05:57:24.528408+00	2026-05-21 05:57:24.528408+00
25	TRX-001-20260521-0002	TRX-001-20260521-0002	2026-05-21 08:32:09.327127+00	Test Customer	200000	0	200000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 200000, "reference_no": null}]	POS_EXPO	\N	2026-05-21 08:32:09.327127+00	2026-05-21 08:32:09.336826+00	2026-05-21 08:32:09.336826+00
26	TRX-001-20260521-0003	TRX-001-20260521-0003	2026-05-21 12:53:46.968321+00	FYK Mila	325000	50000	275000	PAID	\N	[{"item_type": "service", "item_name": "Volume Lash Extension", "qty": 1, "unit_price": 200000, "discount": 0, "line_total": 200000, "staff_id": null, "staff_name": null}, {"item_type": "product", "item_name": "BBO7 QA Lash Serum", "qty": 1, "unit_price": 125000, "discount": 0, "line_total": 125000, "staff_id": null, "staff_name": null}]	[{"method": "CASH", "amount": 275000, "reference_no": null}]	POS_EXPO	\N	2026-05-21 12:53:46.968321+00	2026-05-21 12:53:46.980501+00	2026-05-21 12:53:46.980501+00
\.


--
-- Data for Name: erp_posting_line; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_posting_line (id, transaction_id, line_no, product_id, product_name, quantity, unit_price, subtotal, discount_amount, tax_amount, tax_id, notes, created_at, updated_at) FROM stdin;
1	1	1	\N	POS Transaction: POS-001-20260519-T003	1	200000	200000	0	0	\N	\N	2026-05-19 09:17:58.412418+00	2026-05-19 09:17:58.412418+00
2	2	1	\N	POS Transaction: POS-001-20260519-T004	1	200000	200000	0	0	\N	\N	2026-05-19 09:18:07.013008+00	2026-05-19 09:18:07.013008+00
3	3	1	\N	POS Transaction: POS-001-20260519-T005	1	200000	200000	0	0	\N	\N	2026-05-19 09:19:03.912388+00	2026-05-19 09:19:03.912388+00
4	4	1	\N	POS Transaction: POS-001-20260519-FINAL	1	200000	200000	0	0	\N	\N	2026-05-19 09:19:53.79576+00	2026-05-19 09:19:53.79576+00
5	5	1	\N	POS Transaction: POS-001-20260519-FINAL2	1	175000	175000	0	0	\N	\N	2026-05-19 09:24:36.733555+00	2026-05-19 09:24:36.733555+00
6	6	1	\N	POS Transaction: POS-BBO9-TEST-17ced7de	1	350000	350000	0	0	\N	\N	2026-05-19 17:50:38.882036+00	2026-05-19 17:50:38.882036+00
7	7	1	\N	POS Transaction: POS-BBO9-AUTO-001	1	350000	350000	0	0	\N	\N	2026-05-19 17:51:55.625881+00	2026-05-19 17:51:55.625881+00
8	8	1	\N	POS Transaction: POS-BBO9-AUTO-002	1	225000	225000	0	0	\N	\N	2026-05-19 17:53:33.822045+00	2026-05-19 17:53:33.822045+00
9	9	1	\N	POS Transaction: POS-BBO9-AUTO-003	1	175000	175000	0	0	\N	\N	2026-05-19 17:55:03.245341+00	2026-05-19 17:55:03.245341+00
10	10	1	\N	POS Transaction: POS-BBO9-AUTO-004	1	175000	175000	0	0	\N	\N	2026-05-19 17:56:23.348492+00	2026-05-19 17:56:23.348492+00
11	11	1	\N	POS Transaction: POS-BBO9-FINAL	1	350000	350000	0	0	\N	\N	2026-05-19 17:57:40.403789+00	2026-05-19 17:57:40.403789+00
12	12	1	\N	POS Transaction: POS-BBO9-CF	1	250000	250000	0	0	\N	\N	2026-05-19 17:58:48.815571+00	2026-05-19 17:58:48.815571+00
13	13	1	\N	POS Transaction: POS-BBO9-CF2	1	300000	300000	0	0	\N	\N	2026-05-19 17:59:31.947139+00	2026-05-19 17:59:31.947139+00
14	14	1	\N	Sewa	1	50000	50000	0	0	\N	Bayar Sampah	2026-05-20 10:54:09.390441+00	2026-05-20 10:54:09.390441+00
\.


--
-- Data for Name: erp_posting_rule; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_posting_rule (id, transaction_type, account_id, debit_or_credit, priority, condition_field, condition_value, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_purchase_order; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_purchase_order (id, po_number, supplier_id, order_date, expected_date, status, total_amount, notes, ordered_at, received_at, cancelled_at, created_by, updated_by, created_at, updated_at) FROM stdin;
2	PUR-001-20260519-0002	2	2026-05-19	2026-05-19	RECEIVED	125000	QA PO BBO-6	2026-05-19 12:38:41.193602	2026-05-19 12:38:41.355464	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 12:38:23.012546+00	2026-05-19 12:38:41.346044+00
1	PUR-001-20260519-0001	2	2026-05-19	2026-05-19	CANCELLED	125000	QA PO BBO-6	\N	\N	2026-05-19 18:20:09.300796	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 12:26:16.807941+00	2026-05-19 18:20:09.294882+00
3	PUR-001-20260520-0001	1	2026-05-20	2026-06-15	CANCELLED	0	QA Test PO	\N	\N	2026-05-19 18:21:10.469587	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:10.278171+00	2026-05-19 18:21:10.464338+00
5	PUR-001-20260520-0003	1	2026-05-20	2026-06-15	CANCELLED	0	QA Test PO	\N	\N	2026-05-19 18:22:09.180567	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:22:09.02966+00	2026-05-19 18:22:09.175415+00
6	PUR-001-20260520-0004	1	2026-05-20	2026-06-15	ORDERED	0	QA Test PO	2026-05-19 18:23:11.177057	\N	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:23:11.14838+00	2026-05-19 18:23:11.171641+00
4	PUR-001-20260520-0002	1	2026-05-20	2026-06-15	CANCELLED	0	\N	\N	\N	2026-05-19 18:23:11.327806	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:34.832508+00	2026-05-19 18:23:11.322098+00
7	PUR-001-20260520-0005	1	2026-05-20	2026-06-15	RECEIVED	0	QA Test PO	2026-05-19 18:24:23.810168	2026-05-19 18:24:23.874093	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:24:23.776817+00	2026-05-19 18:24:23.86263+00
\.


--
-- Data for Name: erp_purchase_order_item; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_purchase_order_item (id, purchase_order_id, line_no, product_id, quantity, received_quantity, unit_cost, subtotal, notes, created_at, updated_at) FROM stdin;
1	1	1	1	5	0	25000	125000	\N	2026-05-19 12:26:16.807941+00	2026-05-19 12:26:16.807941+00
2	2	1	1	5	5	25000	125000	\N	2026-05-19 12:38:23.012546+00	2026-05-19 12:38:41.346044+00
3	3	1	1	5	0	0	0	\N	2026-05-19 18:21:10.278171+00	2026-05-19 18:21:10.278171+00
4	4	1	1	5	0	0	0	\N	2026-05-19 18:21:34.832508+00	2026-05-19 18:21:34.832508+00
5	5	1	1	5	0	0	0	\N	2026-05-19 18:22:09.02966+00	2026-05-19 18:22:09.02966+00
6	6	1	1	5	0	0	0	\N	2026-05-19 18:23:11.14838+00	2026-05-19 18:23:11.14838+00
7	7	1	1	5	5	0	0	\N	2026-05-19 18:24:23.776817+00	2026-05-19 18:24:23.86263+00
\.


--
-- Data for Name: erp_sales_order; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_sales_order (id, sales_number, customer_id, sales_date, status, payment_method, subtotal_amount, discount_amount, tax_amount, total_amount, notes, posted_at, cancelled_at, created_by, updated_by, created_at, updated_at) FROM stdin;
1	SAL-001-20260519-0001	4	2026-05-19	POSTED	QRIS	250000	0	0	250000	BBO-7 QA create/post	2026-05-19 12:52:49.161695	\N	qa-bbo7	qa-bbo7	2026-05-19 12:52:49.091959+00	2026-05-19 12:52:49.145514+00
2	SAL-001-20260519-0002	4	2026-05-19	CANCELLED	CASH	124999875000	0	0	124999875000	 | Cancelled after insufficient-stock QA.	\N	\N	qa-bbo7	qa-bbo7	2026-05-19 12:52:49.201601+00	2026-05-19 12:52:49.201601+00
5	POS-20260520-0001	7	2026-05-20	POSTED	\N	175000	0	0	175000	Auto from POS sync: POS-BBO9-AUTO-001	2026-05-19 17:52:33.345118	\N	pos-sync	pos-sync	2026-05-19 17:52:33.282811+00	2026-05-19 17:52:33.282811+00
7	POS-20260520-0002	9	2026-05-20	POSTED	\N	250000	25000	0	225000	Auto from POS sync: POS-BBO9-AUTO-002	2026-05-19 17:53:53.187982	\N	pos-sync	pos-sync	2026-05-19 17:53:53.12911+00	2026-05-19 17:53:53.12911+00
10	POS-20260520-0003	11	2026-05-20	POSTED	\N	175000	0	0	175000	Auto from POS sync: POS-BBO9-FINAL	2026-05-19 17:57:40.532008	\N	pos-sync	pos-sync	2026-05-19 17:57:40.492772+00	2026-05-19 17:57:40.492772+00
11	POS-20260520-0004	12	2026-05-20	POSTED	\N	250000	0	0	250000	Auto from POS sync: POS-BBO9-CF	2026-05-19 17:58:48.893809	\N	pos-sync	pos-sync	2026-05-19 17:58:48.877854+00	2026-05-19 17:58:48.877854+00
12	POS-20260520-0005	13	2026-05-20	POSTED	\N	300000	0	0	300000	Auto from POS sync: POS-BBO9-CF2	2026-05-19 17:59:32.021896	\N	pos-sync	pos-sync	2026-05-19 17:59:32.004306+00	2026-05-19 17:59:32.004306+00
13	SAL-001-20260520-0001	1	2026-05-20	POSTED	\N	75000	0	0	75000	QA Test SO	2026-05-19 18:21:10.603929	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:10.532604+00	2026-05-19 18:21:10.596143+00
14	SAL-001-20260520-0002	1	2026-05-20	DRAFT	\N	50000	0	0	50000	\N	\N	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:10.653624+00	2026-05-19 18:21:10.653624+00
15	SAL-001-20260520-0003	1	2026-05-20	DRAFT	\N	75000	0	0	75000	\N	\N	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:34.854926+00	2026-05-19 18:21:34.854926+00
16	SAL-001-20260520-0004	1	2026-05-20	POSTED	\N	75000	0	0	75000	QA Test SO	2026-05-19 18:22:09.27771	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:22:09.247949+00	2026-05-19 18:22:09.268894+00
17	SAL-001-20260520-0005	1	2026-05-20	CANCELLED	\N	50000	0	0	50000	\N	\N	2026-05-19 18:22:09.341388	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:22:09.311582+00	2026-05-19 18:22:09.335738+00
18	SAL-001-20260520-0006	1	2026-05-20	POSTED	\N	75000	0	0	75000	QA Test SO	2026-05-19 18:23:11.41108	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:23:11.37856+00	2026-05-19 18:23:11.402674+00
19	SAL-001-20260520-0007	1	2026-05-20	CANCELLED	\N	50000	0	0	50000	\N	\N	2026-05-19 18:23:11.46724	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:23:11.440591+00	2026-05-19 18:23:11.461602+00
20	SAL-001-20260520-0008	1	2026-05-20	POSTED	\N	75000	0	0	75000	QA Test SO	2026-05-19 18:24:23.984875	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:24:23.949554+00	2026-05-19 18:24:23.97649+00
21	SAL-001-20260520-0009	1	2026-05-20	CANCELLED	\N	50000	0	0	50000	\N	\N	2026-05-19 18:24:24.062871	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:24:24.023446+00	2026-05-19 18:24:24.049678+00
22	SAL-001-20260520-0010	1	2026-05-20	POSTED	\N	75000	0	0	75000	\N	2026-05-19 18:28:13.528473	\N	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:28:13.490974+00	2026-05-19 18:28:13.519255+00
\.


--
-- Data for Name: erp_sales_order_item; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_sales_order_item (id, sales_order_id, line_no, product_id, quantity, unit_price, discount_amount, subtotal, notes, created_at, updated_at) FROM stdin;
1	1	1	2	2	125000	0	250000	QA line	2026-05-19 12:52:49.091959+00	2026-05-19 12:52:49.091959+00
2	2	1	2	999999	125000	0	124999875000	\N	2026-05-19 12:52:49.201601+00	2026-05-19 12:52:49.201601+00
5	5	1	2	1	175000	0	175000	POS: BBO7 QA Lash Serum	2026-05-19 17:52:33.282811+00	2026-05-19 17:52:33.282811+00
7	7	1	2	2	125000	0	250000	POS: BBO7 QA Lash Serum	2026-05-19 17:53:53.12911+00	2026-05-19 17:53:53.12911+00
10	10	1	2	1	175000	0	175000	POS: BBO7 QA Lash Serum	2026-05-19 17:57:40.492772+00	2026-05-19 17:57:40.492772+00
11	11	1	2	1	250000	0	250000	POS: BBO7 QA Lash Serum	2026-05-19 17:58:48.877854+00	2026-05-19 17:58:48.877854+00
12	12	1	2	2	150000	0	300000	POS: BBO7 QA Lash Serum	2026-05-19 17:59:32.004306+00	2026-05-19 17:59:32.004306+00
13	13	1	1	1	75000	0	75000	\N	2026-05-19 18:21:10.532604+00	2026-05-19 18:21:10.532604+00
14	14	1	1	1	50000	0	50000	\N	2026-05-19 18:21:10.653624+00	2026-05-19 18:21:10.653624+00
15	15	1	1	1	75000	0	75000	\N	2026-05-19 18:21:34.854926+00	2026-05-19 18:21:34.854926+00
16	16	1	1	1	75000	0	75000	\N	2026-05-19 18:22:09.247949+00	2026-05-19 18:22:09.247949+00
17	17	1	1	1	50000	0	50000	\N	2026-05-19 18:22:09.311582+00	2026-05-19 18:22:09.311582+00
18	18	1	1	1	75000	0	75000	\N	2026-05-19 18:23:11.37856+00	2026-05-19 18:23:11.37856+00
19	19	1	1	1	50000	0	50000	\N	2026-05-19 18:23:11.440591+00	2026-05-19 18:23:11.440591+00
20	20	1	1	1	75000	0	75000	\N	2026-05-19 18:24:23.949554+00	2026-05-19 18:24:23.949554+00
21	21	1	1	1	50000	0	50000	\N	2026-05-19 18:24:24.023446+00	2026-05-19 18:24:24.023446+00
22	22	1	1	1	75000	0	75000	\N	2026-05-19 18:28:13.490974+00	2026-05-19 18:28:13.490974+00
\.


--
-- Data for Name: erp_stock_card; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_stock_card (id, product_id, period_code, opening_qty, in_qty, out_qty, adjustment_qty, closing_qty, avg_unit_cost, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_stock_movement; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_stock_movement (id, product_id, movement_type, quantity, unit_cost, total_cost, reference_type, reference_id, notes, movement_date, balance_before, balance_after, performed_by, created_at, updated_at) FROM stdin;
1	1	IN	2	25000	50000	PURCHASE	2	Partial receive QA	2026-05-19	0	2	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 12:38:41.258946+00	2026-05-19 12:38:41.258946+00
2	1	IN	3	25000	75000	PURCHASE	2	Final receive QA	2026-05-19	2	5	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 12:38:41.346044+00	2026-05-19 12:38:41.346044+00
3	2	IN	10	50000	500000	ADJUSTMENT	BBO7-QA-SEED	Seed stock for BBO-7 QA	2026-05-19	0	10	qa-bbo7	2026-05-19 12:52:48.761481+00	2026-05-19 12:52:48.761481+00
4	2	OUT	-2	0	0	SALE	1	Sales SAL-001-20260519-0001	2026-05-19	10	8	qa-bbo7	2026-05-19 12:52:49.145514+00	2026-05-19 12:52:49.145514+00
7	2	OUT	-1	0	0	SALE	POS-9	POS auto: BBO7 QA Lash Serum	2026-05-20	8	7	pos-sync	2026-05-19 17:52:33.282811+00	2026-05-19 17:52:33.282811+00
9	2	OUT	-2	0	0	SALE	POS-10	POS auto: BBO7 QA Lash Serum	2026-05-20	7	5	pos-sync	2026-05-19 17:53:53.12911+00	2026-05-19 17:53:53.12911+00
12	2	OUT	-1	0	0	SALE	POS-13	POS auto: BBO7 QA Lash Serum	2026-05-20	5	4	pos-sync	2026-05-19 17:57:40.492772+00	2026-05-19 17:57:40.492772+00
13	2	OUT	-1	0	0	SALE	POS-14	POS auto: BBO7 QA Lash Serum	2026-05-20	4	3	pos-sync	2026-05-19 17:58:48.877854+00	2026-05-19 17:58:48.877854+00
14	2	OUT	-2	0	0	SALE	POS-15	POS auto: BBO7 QA Lash Serum	2026-05-20	3	1	pos-sync	2026-05-19 17:59:32.004306+00	2026-05-19 17:59:32.004306+00
15	1	OUT	-1	0	0	SALE	13	Sales SAL-001-20260520-0001	2026-05-20	5	4	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:21:10.596143+00	2026-05-19 18:21:10.596143+00
16	1	OUT	-1	0	0	SALE	16	Sales SAL-001-20260520-0004	2026-05-20	4	3	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:22:09.268894+00	2026-05-19 18:22:09.268894+00
17	1	OUT	-1	0	0	SALE	18	Sales SAL-001-20260520-0006	2026-05-20	3	2	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:23:11.402674+00	2026-05-19 18:23:11.402674+00
18	1	IN	5	0	0	PURCHASE	7	Receive PUR-001-20260520-0005	2026-05-20	2	7	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:24:23.86263+00	2026-05-19 18:24:23.86263+00
19	1	OUT	-1	0	0	SALE	20	Sales SAL-001-20260520-0008	2026-05-20	7	6	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:24:23.97649+00	2026-05-19 18:24:23.97649+00
20	1	OUT	-1	0	0	SALE	22	Sales SAL-001-20260520-0010	2026-05-20	6	5	5c4be5e5-aac1-4c4d-aca3-e707fff275f3	2026-05-19 18:28:13.519255+00	2026-05-19 18:28:13.519255+00
\.


--
-- Data for Name: erp_stock_opname; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_stock_opname (id, code, opname_date, status, total_items, total_difference, notes, completed_at, completed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_stock_opname_item; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_stock_opname_item (id, opname_id, product_id, system_qty, physical_qty, difference, unit_cost, difference_value, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_treatment_record; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_treatment_record (id, code, transaction_id, customer_id, customer_name, customer_phone, therapist_id, therapist_name, services, assigned_bed, status, started_at, completed_at, before_photos, after_photos, therapist_notes, total_price, discount, sync_status, synced_at, created_at, updated_at) FROM stdin;
1	TRM-001-20260519-0001	\N	\N	Dian Sastro	08123456789	\N	Rina	[{"name": "Classic Lash Extension"}, {"name": "Eyelash Removal"}]	Bed 1	COMPLETED	2026-05-19 20:02:22.626315+00	2026-05-19 20:02:27.222289+00	[]	[]	Hasil bagus, customer puas	205000	0	PENDING	\N	2026-05-19 20:02:18.395202+00	2026-05-19 20:02:27.22024+00
\.


--
-- Data for Name: erp_work_in_progress; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_work_in_progress (id, code, product_id, batch_number, planned_qty, actual_qty, status, start_date, end_date, total_material_cost, total_labor_cost, total_overhead_cost, total_cost, notes, completed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: erp_wip_material; Type: TABLE DATA; Schema: public; Owner: salon
--

COPY public.erp_wip_material (id, wip_id, product_id, planned_qty, actual_qty, unit_cost, subtotal, created_at, updated_at) FROM stdin;
\.


--
-- Name: erp_account_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_account_mapping_id_seq', 16, true);


--
-- Name: erp_asset_depreciation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_asset_depreciation_id_seq', 1, false);


--
-- Name: erp_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_audit_log_id_seq', 11, true);


--
-- Name: erp_bank_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_bank_account_id_seq', 1, false);


--
-- Name: erp_bank_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_bank_transaction_id_seq', 1, false);


--
-- Name: erp_bill_of_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_bill_of_material_id_seq', 1, false);


--
-- Name: erp_bom_component_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_bom_component_id_seq', 1, false);


--
-- Name: erp_booking_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_booking_record_id_seq', 5, true);


--
-- Name: erp_doc_cross_reference_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_doc_cross_reference_id_seq', 1, false);


--
-- Name: erp_doc_sequence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_doc_sequence_id_seq', 5, true);


--
-- Name: erp_document_registry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_document_registry_id_seq', 45, true);


--
-- Name: erp_financial_period_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_financial_period_id_seq', 1, true);


--
-- Name: erp_fixed_asset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_fixed_asset_id_seq', 1, false);


--
-- Name: erp_journal_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_journal_entry_id_seq', 14, true);


--
-- Name: erp_journal_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_journal_line_id_seq', 20, true);


--
-- Name: erp_master_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_account_id_seq', 32, true);


--
-- Name: erp_master_bed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_bed_id_seq', 1, false);


--
-- Name: erp_master_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_branch_id_seq', 1, false);


--
-- Name: erp_master_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_category_id_seq', 1, false);


--
-- Name: erp_master_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_company_id_seq', 1, false);


--
-- Name: erp_master_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_customer_id_seq', 13, true);


--
-- Name: erp_master_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_product_id_seq', 2, true);


--
-- Name: erp_master_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_service_id_seq', 20, true);


--
-- Name: erp_master_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_staff_id_seq', 1, true);


--
-- Name: erp_master_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_supplier_id_seq', 3, true);


--
-- Name: erp_master_tax_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_tax_id_seq', 1, false);


--
-- Name: erp_master_voucher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_master_voucher_id_seq', 1, false);


--
-- Name: erp_period_close_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_period_close_log_id_seq', 1, false);


--
-- Name: erp_pos_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_pos_session_id_seq', 12, true);


--
-- Name: erp_pos_settlement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_pos_settlement_id_seq', 1, false);


--
-- Name: erp_pos_transaction_sync_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_pos_transaction_sync_id_seq', 26, true);


--
-- Name: erp_posting_line_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_posting_line_id_seq', 14, true);


--
-- Name: erp_posting_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_posting_rule_id_seq', 1, false);


--
-- Name: erp_posting_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_posting_transaction_id_seq', 14, true);


--
-- Name: erp_purchase_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_purchase_order_id_seq', 7, true);


--
-- Name: erp_purchase_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_purchase_order_item_id_seq', 7, true);


--
-- Name: erp_sales_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_sales_order_id_seq', 22, true);


--
-- Name: erp_sales_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_sales_order_item_id_seq', 22, true);


--
-- Name: erp_stock_card_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_stock_card_id_seq', 1, false);


--
-- Name: erp_stock_movement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_stock_movement_id_seq', 20, true);


--
-- Name: erp_stock_opname_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_stock_opname_id_seq', 1, false);


--
-- Name: erp_stock_opname_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_stock_opname_item_id_seq', 1, false);


--
-- Name: erp_treatment_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_treatment_record_id_seq', 1, true);


--
-- Name: erp_wip_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_wip_material_id_seq', 1, false);


--
-- Name: erp_work_in_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: salon
--

SELECT pg_catalog.setval('public.erp_work_in_progress_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict y3ga4nYjoe7diwzRWQrhK2F6pkvyka8ieTzfWonofG2Dg1rdhsrafmukVeWIHWU

