--
-- PostgreSQL database dump
--

\restrict 08ZMGN67roqf6utLhYR3vbRXzKI1oTapdHk2elNb6xYTyoHaV3NzcPZwh3Pi7fW

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: salon
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO salon;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: salon
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: salon
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'BOOKED',
    'DONE',
    'CANCELLED',
    'NO_SHOW'
);


ALTER TYPE public."BookingStatus" OWNER TO salon;

--
-- Name: CommissionType; Type: TYPE; Schema: public; Owner: salon
--

CREATE TYPE public."CommissionType" AS ENUM (
    'PERCENTAGE',
    'FIXED'
);


ALTER TYPE public."CommissionType" OWNER TO salon;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: salon
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PAID',
    'PARTIAL',
    'UNPAID'
);


ALTER TYPE public."PaymentStatus" OWNER TO salon;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: salon
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'STAFF'
);


ALTER TYPE public."UserRole" OWNER TO salon;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text NOT NULL,
    customer_name text NOT NULL,
    customer_id text,
    customer_phone text,
    service_id text,
    service_name text,
    staff_id text,
    staff_name text,
    status public."BookingStatus" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Booking" OWNER TO salon;

--
-- Name: Commission; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Commission" (
    id text NOT NULL,
    staff_id text NOT NULL,
    transaction_id text NOT NULL,
    amount bigint NOT NULL,
    calculated boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Commission" OWNER TO salon;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    instagram text,
    birthday timestamp(3) without time zone,
    notes text,
    total_visit integer DEFAULT 0 NOT NULL,
    total_spending bigint DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO salon;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    description text NOT NULL,
    amount bigint NOT NULL,
    category text,
    expense_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Expense" OWNER TO salon;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    transaction_id text NOT NULL,
    method text NOT NULL,
    amount bigint NOT NULL,
    reference_no text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO salon;

--
-- Name: PosSession; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."PosSession" (
    id text NOT NULL,
    code text NOT NULL,
    opened_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    closed_at timestamp(3) without time zone,
    opened_by text NOT NULL,
    closed_by text,
    opening_cash bigint DEFAULT 0 NOT NULL,
    closing_cash bigint,
    expected_cash bigint,
    difference bigint,
    total_sales bigint DEFAULT 0 NOT NULL,
    total_transactions integer DEFAULT 0 NOT NULL,
    notes text,
    status text DEFAULT 'OPEN'::character varying NOT NULL,
    erp_doc_key text,
    erp_synced_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PosSession" OWNER TO salon;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    category text,
    sku text,
    cost_price bigint DEFAULT 0 NOT NULL,
    selling_price bigint DEFAULT 0 NOT NULL,
    stock_qty integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 5 NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO salon;

--
-- Name: Service; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Service" (
    id text NOT NULL,
    name text NOT NULL,
    category text,
    price bigint NOT NULL,
    duration_min integer DEFAULT 60 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Service" OWNER TO salon;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public."Setting" OWNER TO salon;

--
-- Name: Staff; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'Therapist'::text NOT NULL,
    phone text,
    commission_type public."CommissionType" NOT NULL,
    commission_value numeric(65,30) DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Staff" OWNER TO salon;

--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    product_id text NOT NULL,
    type text NOT NULL,
    qty integer NOT NULL,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StockMovement" OWNER TO salon;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    code text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    customer_id text,
    customer_name text NOT NULL,
    staff_id text,
    staff_name text,
    subtotal bigint NOT NULL,
    discount bigint DEFAULT 0 NOT NULL,
    grand_total bigint NOT NULL,
    payment_status public."PaymentStatus" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_id text,
    erp_synced boolean DEFAULT false NOT NULL,
    erp_doc_key text,
    erp_synced_at timestamp(3) without time zone
);


ALTER TABLE public."Transaction" OWNER TO salon;

--
-- Name: TransactionItem; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."TransactionItem" (
    id text NOT NULL,
    transaction_id text NOT NULL,
    item_type text DEFAULT 'service'::text NOT NULL,
    item_name text NOT NULL,
    qty integer NOT NULL,
    unit_price bigint NOT NULL,
    discount bigint DEFAULT 0 NOT NULL,
    line_total bigint NOT NULL,
    staff_id text,
    staff_name text
);


ALTER TABLE public."TransactionItem" OWNER TO salon;

--
-- Name: TreatmentRecord; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."TreatmentRecord" (
    id text NOT NULL,
    transaction_id text NOT NULL,
    customer_name text NOT NULL,
    therapist_name text,
    services text[],
    therapist_notes text,
    before_photos text[],
    after_photos text[],
    status text DEFAULT 'PENDING'::text NOT NULL,
    started_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    code text DEFAULT ''::text NOT NULL
);


ALTER TABLE public."TreatmentRecord" OWNER TO salon;

--
-- Name: User; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public."User" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    role public."UserRole" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO salon;

--
-- Name: erp_account_mapping; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_account_mapping (
    id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    account_id integer NOT NULL,
    debit_or_credit character varying(10) DEFAULT 'DEBIT'::character varying NOT NULL,
    priority integer DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.erp_account_mapping OWNER TO salon;

--
-- Name: erp_account_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_account_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_account_mapping_id_seq OWNER TO salon;

--
-- Name: erp_account_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_account_mapping_id_seq OWNED BY public.erp_account_mapping.id;


--
-- Name: erp_asset_depreciation; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_asset_depreciation (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    period_code character varying(10) NOT NULL,
    depreciation_amount bigint NOT NULL,
    accumulated_after bigint NOT NULL,
    book_value_after bigint NOT NULL,
    journal_entry_id integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_asset_depreciation OWNER TO salon;

--
-- Name: COLUMN erp_asset_depreciation.period_code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_asset_depreciation.period_code IS 'e.g. ''2026-05''';


--
-- Name: COLUMN erp_asset_depreciation.accumulated_after; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_asset_depreciation.accumulated_after IS 'Accumulated depreciation after this entry';


--
-- Name: COLUMN erp_asset_depreciation.journal_entry_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_asset_depreciation.journal_entry_id IS 'Link ke jurnal penyusutan';


--
-- Name: erp_asset_depreciation_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_asset_depreciation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_asset_depreciation_id_seq OWNER TO salon;

--
-- Name: erp_asset_depreciation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_asset_depreciation_id_seq OWNED BY public.erp_asset_depreciation.id;


--
-- Name: erp_audit_log; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_audit_log (
    id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id character varying(50),
    action character varying(20) NOT NULL,
    summary character varying(500),
    old_values json,
    new_values json,
    performed_by character varying(100),
    performed_at timestamp without time zone NOT NULL,
    ip_address character varying(50),
    branch_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_audit_log OWNER TO salon;

--
-- Name: COLUMN erp_audit_log.table_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.table_name IS 'Nama tabel yang dimodifikasi, e.g. ''erp_posting_transaction''';


--
-- Name: COLUMN erp_audit_log.record_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.record_id IS 'ID record yang diubah';


--
-- Name: COLUMN erp_audit_log.action; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.action IS 'CREATE / UPDATE / DELETE / POST / CANCEL / LOCK / UNLOCK / CLOSE / REOPEN / DEPOSIT / WITHDRAW / TRANSFER / DEPRECIATE / DISPOSE';


--
-- Name: COLUMN erp_audit_log.summary; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.summary IS 'Deskripsi singkat (human-readable)';


--
-- Name: COLUMN erp_audit_log.old_values; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.old_values IS 'Snapshot data sebelum perubahan';


--
-- Name: COLUMN erp_audit_log.new_values; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.new_values IS 'Snapshot data setelah perubahan';


--
-- Name: COLUMN erp_audit_log.performed_by; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.performed_by IS 'Username / user ID yang melakukan';


--
-- Name: COLUMN erp_audit_log.performed_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.performed_at IS 'Timestamp kejadian';


--
-- Name: COLUMN erp_audit_log.branch_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_audit_log.branch_id IS 'Branch tempat kejadian';


--
-- Name: erp_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_audit_log_id_seq OWNER TO salon;

--
-- Name: erp_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_audit_log_id_seq OWNED BY public.erp_audit_log.id;


--
-- Name: erp_bank_account; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_bank_account (
    id integer NOT NULL,
    account_name character varying(200) NOT NULL,
    bank_name character varying(100),
    account_number character varying(50),
    account_type character varying(20) NOT NULL,
    currency character varying(10) NOT NULL,
    opening_balance bigint NOT NULL,
    current_balance bigint NOT NULL,
    branch_id integer,
    is_active boolean NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_bank_account OWNER TO salon;

--
-- Name: COLUMN erp_bank_account.account_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_account.account_name IS 'Nama rekening, e.g. ''Kas Tunai'', ''BCA 1234''';


--
-- Name: COLUMN erp_bank_account.bank_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_account.bank_name IS 'Nama bank, e.g. ''BCA'', ''Mandiri''';


--
-- Name: COLUMN erp_bank_account.account_number; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_account.account_number IS 'No. rekening';


--
-- Name: COLUMN erp_bank_account.account_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_account.account_type IS 'CASH / BANK / E_WALLET';


--
-- Name: erp_bank_account_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_bank_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_bank_account_id_seq OWNER TO salon;

--
-- Name: erp_bank_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_bank_account_id_seq OWNED BY public.erp_bank_account.id;


--
-- Name: erp_bank_transaction; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_bank_transaction (
    id integer NOT NULL,
    bank_account_id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    amount bigint NOT NULL,
    transaction_date date NOT NULL,
    description text,
    ref_table character varying(50),
    ref_id integer,
    transfer_to_account_id integer,
    is_reconciled boolean NOT NULL,
    reconciled_at timestamp without time zone,
    balance_before bigint,
    balance_after bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_bank_transaction OWNER TO salon;

--
-- Name: COLUMN erp_bank_transaction.transaction_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_transaction.transaction_type IS 'DEPOSIT / WITHDRAWAL / TRANSFER_IN / TRANSFER_OUT';


--
-- Name: COLUMN erp_bank_transaction.ref_table; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_transaction.ref_table IS 'Source table, e.g. ''erp_posting_transaction''';


--
-- Name: COLUMN erp_bank_transaction.ref_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_transaction.ref_id IS 'Source record ID';


--
-- Name: COLUMN erp_bank_transaction.transfer_to_account_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bank_transaction.transfer_to_account_id IS 'For TRANSFER_OUT: destination account';


--
-- Name: erp_bank_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_bank_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_bank_transaction_id_seq OWNER TO salon;

--
-- Name: erp_bank_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_bank_transaction_id_seq OWNED BY public.erp_bank_transaction.id;


--
-- Name: erp_bill_of_material; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_bill_of_material (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    service_id integer,
    total_standard_cost bigint NOT NULL,
    is_active boolean NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_bill_of_material OWNER TO salon;

--
-- Name: COLUMN erp_bill_of_material.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bill_of_material.code IS 'Kode BOM, e.g. BOM-CLASSIC-001';


--
-- Name: COLUMN erp_bill_of_material.name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bill_of_material.name IS 'Nama BOM';


--
-- Name: COLUMN erp_bill_of_material.service_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bill_of_material.service_id IS 'Treatment/service yang menggunakan BOM ini';


--
-- Name: COLUMN erp_bill_of_material.total_standard_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bill_of_material.total_standard_cost IS 'Total biaya standar dari semua komponen';


--
-- Name: erp_bill_of_material_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_bill_of_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_bill_of_material_id_seq OWNER TO salon;

--
-- Name: erp_bill_of_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_bill_of_material_id_seq OWNED BY public.erp_bill_of_material.id;


--
-- Name: erp_bom_component; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_bom_component (
    id integer NOT NULL,
    bom_id integer NOT NULL,
    line_no integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_cost bigint NOT NULL,
    subtotal bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_bom_component OWNER TO salon;

--
-- Name: COLUMN erp_bom_component.product_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bom_component.product_id IS 'Produk/bahan yang dibutuhkan';


--
-- Name: COLUMN erp_bom_component.quantity; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bom_component.quantity IS 'Jumlah bahan yang dibutuhkan';


--
-- Name: COLUMN erp_bom_component.unit_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bom_component.unit_cost IS 'Biaya satuan saat BOM dibuat/diupdate';


--
-- Name: COLUMN erp_bom_component.subtotal; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_bom_component.subtotal IS 'quantity * unit_cost';


--
-- Name: erp_bom_component_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_bom_component_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_bom_component_id_seq OWNER TO salon;

--
-- Name: erp_bom_component_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_bom_component_id_seq OWNED BY public.erp_bom_component.id;


--
-- Name: erp_booking_record; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_booking_record (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    customer_name character varying(200) NOT NULL,
    customer_phone character varying(50),
    services jsonb NOT NULL,
    service_names text,
    therapist_name character varying(200) NOT NULL,
    assigned_bed character varying(50),
    booking_date timestamp with time zone NOT NULL,
    estimated_duration integer NOT NULL,
    status character varying(20) NOT NULL,
    checked_in_at timestamp with time zone,
    completed_at timestamp with time zone,
    transaction_id character varying(50),
    total_price bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_booking_record OWNER TO salon;

--
-- Name: COLUMN erp_booking_record.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.code IS 'Kode Booking: BOOK-001-YYYYMMDD-NNNN';


--
-- Name: COLUMN erp_booking_record.customer_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.customer_name IS 'Nama customer';


--
-- Name: COLUMN erp_booking_record.customer_phone; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.customer_phone IS 'Nomor telepon customer';


--
-- Name: COLUMN erp_booking_record.services; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.services IS 'JSON array: [{name, price, duration}] — daftar layanan';


--
-- Name: COLUMN erp_booking_record.service_names; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.service_names IS 'Plain text: nama layanan (untuk tampilan cepat)';


--
-- Name: COLUMN erp_booking_record.therapist_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.therapist_name IS 'Nama therapist yang ditugaskan';


--
-- Name: COLUMN erp_booking_record.assigned_bed; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.assigned_bed IS 'Nomor bed yang digunakan';


--
-- Name: COLUMN erp_booking_record.booking_date; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.booking_date IS 'Tanggal & jam booking';


--
-- Name: COLUMN erp_booking_record.estimated_duration; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.estimated_duration IS 'Estimasi durasi treatment (menit)';


--
-- Name: COLUMN erp_booking_record.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.status IS 'BOOKED / CHECKED_IN / DONE / CANCELLED / NO_SHOW';


--
-- Name: COLUMN erp_booking_record.checked_in_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.checked_in_at IS 'Waktu check-in (customer datang)';


--
-- Name: COLUMN erp_booking_record.completed_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.completed_at IS 'Waktu selesai (treatment done)';


--
-- Name: COLUMN erp_booking_record.transaction_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.transaction_id IS 'Transaction code yang terbuat saat check-in (POS-...)';


--
-- Name: COLUMN erp_booking_record.total_price; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.total_price IS 'Total harga treatment (dalam rupiah)';


--
-- Name: COLUMN erp_booking_record.notes; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_booking_record.notes IS 'Catatan kasir/customer';


--
-- Name: erp_booking_record_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_booking_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_booking_record_id_seq OWNER TO salon;

--
-- Name: erp_booking_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_booking_record_id_seq OWNED BY public.erp_booking_record.id;


--
-- Name: erp_doc_cross_reference; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_doc_cross_reference (
    id integer NOT NULL,
    source_doc_key character varying(50) NOT NULL,
    target_doc_key character varying(50) NOT NULL,
    relation_type character varying(20) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_doc_cross_reference OWNER TO salon;

--
-- Name: erp_doc_cross_reference_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_doc_cross_reference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_doc_cross_reference_id_seq OWNER TO salon;

--
-- Name: erp_doc_cross_reference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_doc_cross_reference_id_seq OWNED BY public.erp_doc_cross_reference.id;


--
-- Name: erp_doc_sequence; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_doc_sequence (
    id integer NOT NULL,
    module character varying(10) NOT NULL,
    branch character varying(10) NOT NULL,
    date_key character varying(8) NOT NULL,
    seq integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_doc_sequence OWNER TO salon;

--
-- Name: erp_doc_sequence_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_doc_sequence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_doc_sequence_id_seq OWNER TO salon;

--
-- Name: erp_doc_sequence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_doc_sequence_id_seq OWNED BY public.erp_doc_sequence.id;


--
-- Name: erp_document_registry; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_document_registry (
    id integer NOT NULL,
    doc_key character varying(50) NOT NULL,
    module character varying(10) NOT NULL,
    branch character varying(10) NOT NULL,
    doc_date date NOT NULL,
    seq integer NOT NULL,
    ref_table character varying(50),
    ref_id character varying(50),
    status character varying(20),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_document_registry OWNER TO salon;

--
-- Name: erp_document_registry_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_document_registry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_document_registry_id_seq OWNER TO salon;

--
-- Name: erp_document_registry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_document_registry_id_seq OWNED BY public.erp_document_registry.id;


--
-- Name: erp_financial_period; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_financial_period (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(50),
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_locked boolean NOT NULL,
    locked_at timestamp without time zone,
    locked_by character varying(100),
    is_closed boolean NOT NULL,
    closed_at timestamp without time zone,
    closed_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_financial_period OWNER TO salon;

--
-- Name: COLUMN erp_financial_period.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_financial_period.code IS 'contoh: ''2026-05''';


--
-- Name: COLUMN erp_financial_period.name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_financial_period.name IS 'contoh: ''Mei 2026''';


--
-- Name: COLUMN erp_financial_period.is_closed; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_financial_period.is_closed IS 'TRUE setelah period closing dilakukan';


--
-- Name: erp_financial_period_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_financial_period_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_financial_period_id_seq OWNER TO salon;

--
-- Name: erp_financial_period_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_financial_period_id_seq OWNED BY public.erp_financial_period.id;


--
-- Name: erp_fixed_asset; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_fixed_asset (
    id integer NOT NULL,
    asset_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(50),
    purchase_date date NOT NULL,
    purchase_price bigint NOT NULL,
    useful_life_years integer NOT NULL,
    residual_value bigint NOT NULL,
    depreciation_method character varying(20),
    accumulated_depreciation bigint NOT NULL,
    book_value bigint,
    status character varying(20),
    disposed_at date,
    disposal_price bigint,
    branch_id integer,
    notes text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_fixed_asset OWNER TO salon;

--
-- Name: COLUMN erp_fixed_asset.category; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.category IS 'EQUIPMENT / FURNITURE / VEHICLE / BUILDING / OTHER';


--
-- Name: COLUMN erp_fixed_asset.useful_life_years; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.useful_life_years IS 'Masa manfaat dalam tahun';


--
-- Name: COLUMN erp_fixed_asset.residual_value; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.residual_value IS 'Nilai residu / sisa';


--
-- Name: COLUMN erp_fixed_asset.depreciation_method; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.depreciation_method IS 'STRAIGHT_LINE / DOUBLE_DECLINING';


--
-- Name: COLUMN erp_fixed_asset.book_value; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.book_value IS 'Nilai buku = purchase_price - accumulated_depreciation';


--
-- Name: COLUMN erp_fixed_asset.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_fixed_asset.status IS 'ACTIVE / FULLY_DEPRECIATED / DISPOSED / SOLD';


--
-- Name: erp_fixed_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_fixed_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_fixed_asset_id_seq OWNER TO salon;

--
-- Name: erp_fixed_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_fixed_asset_id_seq OWNED BY public.erp_fixed_asset.id;


--
-- Name: erp_journal_entry; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_journal_entry (
    id integer NOT NULL,
    je_number character varying(50) NOT NULL,
    transaction_id integer,
    transaction_type character varying(20) NOT NULL,
    period_id integer,
    description text,
    status character varying(20) NOT NULL,
    posted_at timestamp without time zone,
    posted_by character varying(100),
    entry_date date NOT NULL,
    total_debit bigint NOT NULL,
    total_credit bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_journal_entry OWNER TO salon;

--
-- Name: COLUMN erp_journal_entry.je_number; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_journal_entry.je_number IS 'Journal entry number, e.g. JE-MAIN-20260518-0001';


--
-- Name: COLUMN erp_journal_entry.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_journal_entry.status IS 'DRAFT / POSTED / VOID';


--
-- Name: COLUMN erp_journal_entry.entry_date; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_journal_entry.entry_date IS 'Date the journal entry is recorded';


--
-- Name: erp_journal_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_journal_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_journal_entry_id_seq OWNER TO salon;

--
-- Name: erp_journal_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_journal_entry_id_seq OWNED BY public.erp_journal_entry.id;


--
-- Name: erp_journal_line; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_journal_line (
    id integer NOT NULL,
    journal_entry_id integer NOT NULL,
    line_no integer NOT NULL,
    account_id integer NOT NULL,
    account_code character varying(20),
    account_name character varying(200),
    debit_amount bigint NOT NULL,
    credit_amount bigint NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_journal_line OWNER TO salon;

--
-- Name: COLUMN erp_journal_line.account_code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_journal_line.account_code IS 'Denormalized for fast reporting';


--
-- Name: erp_journal_line_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_journal_line_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_journal_line_id_seq OWNER TO salon;

--
-- Name: erp_journal_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_journal_line_id_seq OWNED BY public.erp_journal_line.id;


--
-- Name: erp_master_account; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_account (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id integer,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    level integer DEFAULT 3 NOT NULL,
    is_system boolean DEFAULT false NOT NULL
);


ALTER TABLE public.erp_master_account OWNER TO salon;

--
-- Name: COLUMN erp_master_account.type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_account.type IS 'ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE';


--
-- Name: erp_master_account_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_account_id_seq OWNER TO salon;

--
-- Name: erp_master_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_account_id_seq OWNED BY public.erp_master_account.id;


--
-- Name: erp_master_bed; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_bed (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    section character varying(50),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_bed OWNER TO salon;

--
-- Name: erp_master_bed_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_bed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_bed_id_seq OWNER TO salon;

--
-- Name: erp_master_bed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_bed_id_seq OWNED BY public.erp_master_bed.id;


--
-- Name: erp_master_branch; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_branch (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(30),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_branch OWNER TO salon;

--
-- Name: erp_master_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_branch_id_seq OWNER TO salon;

--
-- Name: erp_master_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_branch_id_seq OWNED BY public.erp_master_branch.id;


--
-- Name: erp_master_category; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_category (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id integer,
    sort_order integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_category OWNER TO salon;

--
-- Name: COLUMN erp_master_category.type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_category.type IS 'PRODUCT / POS / ACCOUNTING';


--
-- Name: erp_master_category_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_category_id_seq OWNER TO salon;

--
-- Name: erp_master_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_category_id_seq OWNED BY public.erp_master_category.id;


--
-- Name: erp_master_company; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_company (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    address text,
    phone character varying(30),
    email character varying(100),
    tax_id character varying(50),
    logo_url character varying(500),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_company OWNER TO salon;

--
-- Name: erp_master_company_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_company_id_seq OWNER TO salon;

--
-- Name: erp_master_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_company_id_seq OWNED BY public.erp_master_company.id;


--
-- Name: erp_master_customer; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_customer (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(30),
    email character varying(100),
    address text,
    notes text,
    total_visits integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_customer OWNER TO salon;

--
-- Name: erp_master_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_customer_id_seq OWNER TO salon;

--
-- Name: erp_master_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_customer_id_seq OWNED BY public.erp_master_customer.id;


--
-- Name: erp_master_product; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_product (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(100),
    sub_category character varying(100),
    unit character varying(20),
    sku character varying(50),
    cost_price bigint NOT NULL,
    selling_price bigint NOT NULL,
    min_stock integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_product OWNER TO salon;

--
-- Name: erp_master_product_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_product_id_seq OWNER TO salon;

--
-- Name: erp_master_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_product_id_seq OWNED BY public.erp_master_product.id;


--
-- Name: erp_master_service; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_service (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(100),
    duration integer,
    price bigint NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_service OWNER TO salon;

--
-- Name: COLUMN erp_master_service.duration; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_service.duration IS 'Durasi dalam menit';


--
-- Name: erp_master_service_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_service_id_seq OWNER TO salon;

--
-- Name: erp_master_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_service_id_seq OWNED BY public.erp_master_service.id;


--
-- Name: erp_master_staff; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_staff (
    id integer NOT NULL,
    staff_id character varying(50),
    name character varying(150) NOT NULL,
    role character varying(50),
    commission_type character varying(20),
    commission_value double precision,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kabin character varying(10)
);


ALTER TABLE public.erp_master_staff OWNER TO salon;

--
-- Name: COLUMN erp_master_staff.staff_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_staff.staff_id IS 'ID dari sistem POS';


--
-- Name: COLUMN erp_master_staff.commission_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_staff.commission_type IS 'PERCENTAGE / FIXED';


--
-- Name: erp_master_staff_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_staff_id_seq OWNER TO salon;

--
-- Name: erp_master_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_staff_id_seq OWNED BY public.erp_master_staff.id;


--
-- Name: erp_master_supplier; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_supplier (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact_person character varying(150),
    phone character varying(30),
    email character varying(100),
    address text,
    notes text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_supplier OWNER TO salon;

--
-- Name: erp_master_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_supplier_id_seq OWNER TO salon;

--
-- Name: erp_master_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_supplier_id_seq OWNED BY public.erp_master_supplier.id;


--
-- Name: erp_master_tax; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_tax (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    rate double precision NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_tax OWNER TO salon;

--
-- Name: erp_master_tax_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_tax_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_tax_id_seq OWNER TO salon;

--
-- Name: erp_master_tax_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_tax_id_seq OWNED BY public.erp_master_tax.id;


--
-- Name: erp_master_voucher; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_master_voucher (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20) NOT NULL,
    discount_value double precision NOT NULL,
    min_purchase bigint NOT NULL,
    max_use integer NOT NULL,
    used_count integer NOT NULL,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_master_voucher OWNER TO salon;

--
-- Name: COLUMN erp_master_voucher.discount_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_voucher.discount_type IS 'PERCENTAGE / FIXED';


--
-- Name: COLUMN erp_master_voucher.max_use; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_master_voucher.max_use IS '0 = unlimited';


--
-- Name: erp_master_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_master_voucher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_master_voucher_id_seq OWNER TO salon;

--
-- Name: erp_master_voucher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_master_voucher_id_seq OWNED BY public.erp_master_voucher.id;


--
-- Name: erp_period_close_log; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_period_close_log (
    id integer NOT NULL,
    period_id integer NOT NULL,
    action character varying(20) NOT NULL,
    total_revenue bigint NOT NULL,
    total_expenses bigint NOT NULL,
    net_income bigint NOT NULL,
    je_number character varying(50),
    notes text,
    performed_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_period_close_log OWNER TO salon;

--
-- Name: COLUMN erp_period_close_log.action; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_period_close_log.action IS 'CLOSE / REOPEN / LOCK / UNLOCK';


--
-- Name: COLUMN erp_period_close_log.je_number; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_period_close_log.je_number IS 'Closing journal entry number, if CLOSE action';


--
-- Name: erp_period_close_log_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_period_close_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_period_close_log_id_seq OWNER TO salon;

--
-- Name: erp_period_close_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_period_close_log_id_seq OWNED BY public.erp_period_close_log.id;


--
-- Name: erp_pos_session; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_pos_session (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    opened_by character varying(100) NOT NULL,
    closed_by character varying(100),
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    opening_cash bigint NOT NULL,
    closing_cash bigint,
    expected_cash bigint,
    difference bigint,
    total_sales bigint NOT NULL,
    total_transactions integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    total_expenses bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.erp_pos_session OWNER TO salon;

--
-- Name: COLUMN erp_pos_session.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.code IS 'Kode sesi: SFT-001-YYYYMMDD-NNNN';


--
-- Name: COLUMN erp_pos_session.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.status IS 'OPEN / CLOSED';


--
-- Name: COLUMN erp_pos_session.opened_by; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.opened_by IS 'Nama/user yang membuka sesi';


--
-- Name: COLUMN erp_pos_session.closed_by; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.closed_by IS 'Nama/user yang menutup sesi';


--
-- Name: COLUMN erp_pos_session.opened_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.opened_at IS 'Waktu buka sesi';


--
-- Name: COLUMN erp_pos_session.closed_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.closed_at IS 'Waktu tutup sesi';


--
-- Name: COLUMN erp_pos_session.opening_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.opening_cash IS 'Kas awal sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_session.closing_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.closing_cash IS 'Kas fisik akhir sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_session.expected_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.expected_cash IS 'Kas yang diharapkan (opening + penjualan)';


--
-- Name: COLUMN erp_pos_session.difference; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.difference IS 'Selisih: closing_cash - expected_cash';


--
-- Name: COLUMN erp_pos_session.total_sales; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.total_sales IS 'Total penjualan selama sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_session.total_transactions; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_session.total_transactions IS 'Jumlah transaksi selama sesi';


--
-- Name: erp_pos_session_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_pos_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_pos_session_id_seq OWNER TO salon;

--
-- Name: erp_pos_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_pos_session_id_seq OWNED BY public.erp_pos_session.id;


--
-- Name: erp_pos_settlement; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_pos_settlement (
    id integer NOT NULL,
    pos_session_id character varying(50) NOT NULL,
    session_code character varying(50) NOT NULL,
    opened_at timestamp with time zone,
    closed_at timestamp with time zone,
    opened_by character varying(100),
    opening_cash bigint NOT NULL,
    closing_cash bigint,
    expected_cash bigint,
    difference bigint,
    total_sales bigint NOT NULL,
    total_transactions integer NOT NULL,
    notes text,
    payment_breakdown text,
    doc_key character varying(50),
    synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    total_expenses bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.erp_pos_settlement OWNER TO salon;

--
-- Name: COLUMN erp_pos_settlement.pos_session_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.pos_session_id IS 'ID sesi dari sistem POS (UUID)';


--
-- Name: COLUMN erp_pos_settlement.session_code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.session_code IS 'Kode sesi POS, e.g. SESSION-20260518-001';


--
-- Name: COLUMN erp_pos_settlement.opened_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.opened_at IS 'Waktu buka sesi';


--
-- Name: COLUMN erp_pos_settlement.closed_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.closed_at IS 'Waktu tutup sesi';


--
-- Name: COLUMN erp_pos_settlement.opened_by; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.opened_by IS 'Nama/user yang membuka sesi';


--
-- Name: COLUMN erp_pos_settlement.opening_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.opening_cash IS 'Kas awal sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_settlement.closing_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.closing_cash IS 'Kas fisik akhir sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_settlement.expected_cash; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.expected_cash IS 'Kas yang diharapkan (opening + penjualan - pengeluaran)';


--
-- Name: COLUMN erp_pos_settlement.difference; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.difference IS 'Selisih: closing_cash - expected_cash';


--
-- Name: COLUMN erp_pos_settlement.total_sales; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.total_sales IS 'Total penjualan selama sesi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_settlement.total_transactions; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.total_transactions IS 'Jumlah transaksi selama sesi';


--
-- Name: COLUMN erp_pos_settlement.payment_breakdown; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.payment_breakdown IS 'JSON: rincian pembayaran per metode (cash, qris, dll)';


--
-- Name: COLUMN erp_pos_settlement.doc_key; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.doc_key IS 'Nomor dokumen ERP yang di-generate dari DocumentRegistry';


--
-- Name: COLUMN erp_pos_settlement.synced_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_settlement.synced_at IS 'Timestamp saat data disinkronisasi ke ERP';


--
-- Name: erp_pos_settlement_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_pos_settlement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_pos_settlement_id_seq OWNER TO salon;

--
-- Name: erp_pos_settlement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_pos_settlement_id_seq OWNED BY public.erp_pos_settlement.id;


--
-- Name: erp_pos_transaction_sync; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_pos_transaction_sync (
    id integer NOT NULL,
    pos_transaction_id character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    date timestamp with time zone NOT NULL,
    customer_name character varying(200),
    subtotal bigint NOT NULL,
    discount bigint NOT NULL,
    grand_total bigint NOT NULL,
    payment_status character varying(20) NOT NULL,
    notes text,
    items text,
    payments text,
    source character varying(20) NOT NULL,
    doc_key character varying(50),
    synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_pos_transaction_sync OWNER TO salon;

--
-- Name: COLUMN erp_pos_transaction_sync.pos_transaction_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.pos_transaction_id IS 'ID transaksi dari sistem POS (NestJS UUID)';


--
-- Name: COLUMN erp_pos_transaction_sync.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.code IS 'Nomor transaksi dari POS, e.g. TRX-20260518-001';


--
-- Name: COLUMN erp_pos_transaction_sync.date; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.date IS 'Tanggal & jam transaksi POS';


--
-- Name: COLUMN erp_pos_transaction_sync.customer_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.customer_name IS 'Nama pelanggan dari POS';


--
-- Name: COLUMN erp_pos_transaction_sync.subtotal; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.subtotal IS 'Subtotal transaksi sebelum diskon (dalam rupiah)';


--
-- Name: COLUMN erp_pos_transaction_sync.discount; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.discount IS 'Diskon transaksi (dalam rupiah)';


--
-- Name: COLUMN erp_pos_transaction_sync.grand_total; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.grand_total IS 'Total akhir setelah diskon (dalam rupiah)';


--
-- Name: COLUMN erp_pos_transaction_sync.payment_status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.payment_status IS 'PAID / UNPAID / PARTIAL / REFUND';


--
-- Name: COLUMN erp_pos_transaction_sync.items; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.items IS 'JSON: daftar item/jasa yang dibeli';


--
-- Name: COLUMN erp_pos_transaction_sync.payments; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.payments IS 'JSON: daftar pembayaran (metode, jumlah)';


--
-- Name: COLUMN erp_pos_transaction_sync.source; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.source IS 'Sumber data, default: POS';


--
-- Name: COLUMN erp_pos_transaction_sync.doc_key; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.doc_key IS 'Nomor dokumen ERP yang di-generate dari DocumentRegistry';


--
-- Name: COLUMN erp_pos_transaction_sync.synced_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_pos_transaction_sync.synced_at IS 'Timestamp saat data disinkronisasi ke ERP';


--
-- Name: erp_pos_transaction_sync_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_pos_transaction_sync_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_pos_transaction_sync_id_seq OWNER TO salon;

--
-- Name: erp_pos_transaction_sync_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_pos_transaction_sync_id_seq OWNED BY public.erp_pos_transaction_sync.id;


--
-- Name: erp_posting_line; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_posting_line (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    line_no integer NOT NULL,
    product_id integer,
    product_name character varying(200),
    quantity integer NOT NULL,
    unit_price bigint NOT NULL,
    subtotal bigint NOT NULL,
    discount_amount bigint NOT NULL,
    tax_amount bigint NOT NULL,
    tax_id integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_posting_line OWNER TO salon;

--
-- Name: erp_posting_line_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_posting_line_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_posting_line_id_seq OWNER TO salon;

--
-- Name: erp_posting_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_posting_line_id_seq OWNED BY public.erp_posting_line.id;


--
-- Name: erp_posting_rule; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_posting_rule (
    id integer NOT NULL,
    transaction_type character varying(20) NOT NULL,
    account_id integer NOT NULL,
    debit_or_credit character varying(10) NOT NULL,
    priority integer NOT NULL,
    condition_field character varying(50),
    condition_value character varying(50),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_posting_rule OWNER TO salon;

--
-- Name: COLUMN erp_posting_rule.transaction_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.transaction_type IS 'SALE / EXPENSE / PAYMENT / PURCHASE / ADJUSTMENT';


--
-- Name: COLUMN erp_posting_rule.account_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.account_id IS 'COA account to post';


--
-- Name: COLUMN erp_posting_rule.debit_or_credit; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.debit_or_credit IS 'DEBIT or CREDIT';


--
-- Name: COLUMN erp_posting_rule.priority; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.priority IS 'Sort order within transaction type';


--
-- Name: COLUMN erp_posting_rule.condition_field; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.condition_field IS 'Optional: field to evaluate, e.g. ''payment_method''';


--
-- Name: COLUMN erp_posting_rule.condition_value; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_rule.condition_value IS 'Optional: expected value, e.g. ''CASH''';


--
-- Name: erp_posting_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_posting_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_posting_rule_id_seq OWNER TO salon;

--
-- Name: erp_posting_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_posting_rule_id_seq OWNED BY public.erp_posting_rule.id;


--
-- Name: erp_posting_transaction; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_posting_transaction (
    id integer NOT NULL,
    doc_number character varying(50) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    ref_table character varying(50),
    ref_id character varying(50),
    total_amount bigint NOT NULL,
    status character varying(20) NOT NULL,
    period_id integer,
    posted_at timestamp without time zone,
    posted_by character varying(100),
    notes text,
    transaction_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_posting_transaction OWNER TO salon;

--
-- Name: COLUMN erp_posting_transaction.doc_number; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.doc_number IS 'Document number from registry, e.g. POS-MAIN-20260518-0001';


--
-- Name: COLUMN erp_posting_transaction.transaction_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.transaction_type IS 'SALE / EXPENSE / PAYMENT / PURCHASE / ADJUSTMENT';


--
-- Name: COLUMN erp_posting_transaction.ref_table; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.ref_table IS 'Source table, e.g. ''transaction'', ''expense''';


--
-- Name: COLUMN erp_posting_transaction.ref_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.ref_id IS 'Source record ID (UUID from POS)';


--
-- Name: COLUMN erp_posting_transaction.total_amount; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.total_amount IS 'Total in Rupiah (integer, no decimal)';


--
-- Name: COLUMN erp_posting_transaction.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.status IS 'DRAFT / POSTED / CANCELLED';


--
-- Name: COLUMN erp_posting_transaction.period_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.period_id IS 'Financial period this belongs to';


--
-- Name: COLUMN erp_posting_transaction.transaction_date; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_posting_transaction.transaction_date IS 'Date the transaction occurred';


--
-- Name: erp_posting_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_posting_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_posting_transaction_id_seq OWNER TO salon;

--
-- Name: erp_posting_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_posting_transaction_id_seq OWNED BY public.erp_posting_transaction.id;


--
-- Name: erp_purchase_order; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_purchase_order (
    id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_id integer NOT NULL,
    order_date date NOT NULL,
    expected_date date,
    status character varying(30) NOT NULL,
    total_amount bigint NOT NULL,
    notes text,
    ordered_at timestamp without time zone,
    received_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_purchase_order OWNER TO salon;

--
-- Name: erp_purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_purchase_order_id_seq OWNER TO salon;

--
-- Name: erp_purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_purchase_order_id_seq OWNED BY public.erp_purchase_order.id;


--
-- Name: erp_purchase_order_item; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_purchase_order_item (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    line_no integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    received_quantity integer NOT NULL,
    unit_cost bigint NOT NULL,
    subtotal bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_purchase_order_item OWNER TO salon;

--
-- Name: erp_purchase_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_purchase_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_purchase_order_item_id_seq OWNER TO salon;

--
-- Name: erp_purchase_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_purchase_order_item_id_seq OWNED BY public.erp_purchase_order_item.id;


--
-- Name: erp_sales_order; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_sales_order (
    id integer NOT NULL,
    sales_number character varying(50) NOT NULL,
    customer_id integer,
    sales_date date NOT NULL,
    status character varying(30) NOT NULL,
    payment_method character varying(50),
    subtotal_amount bigint NOT NULL,
    discount_amount bigint NOT NULL,
    tax_amount bigint NOT NULL,
    total_amount bigint NOT NULL,
    notes text,
    posted_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_sales_order OWNER TO salon;

--
-- Name: erp_sales_order_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_sales_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_sales_order_id_seq OWNER TO salon;

--
-- Name: erp_sales_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_sales_order_id_seq OWNED BY public.erp_sales_order.id;


--
-- Name: erp_sales_order_item; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_sales_order_item (
    id integer NOT NULL,
    sales_order_id integer NOT NULL,
    line_no integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price bigint NOT NULL,
    discount_amount bigint NOT NULL,
    subtotal bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_sales_order_item OWNER TO salon;

--
-- Name: erp_sales_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_sales_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_sales_order_item_id_seq OWNER TO salon;

--
-- Name: erp_sales_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_sales_order_item_id_seq OWNED BY public.erp_sales_order_item.id;


--
-- Name: erp_stock_card; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_stock_card (
    id integer NOT NULL,
    product_id integer NOT NULL,
    period_code character varying(10) NOT NULL,
    opening_qty integer NOT NULL,
    in_qty integer NOT NULL,
    out_qty integer NOT NULL,
    adjustment_qty integer NOT NULL,
    closing_qty integer NOT NULL,
    avg_unit_cost bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_stock_card OWNER TO salon;

--
-- Name: COLUMN erp_stock_card.period_code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_card.period_code IS 'YYYY-MM';


--
-- Name: erp_stock_card_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_stock_card_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_stock_card_id_seq OWNER TO salon;

--
-- Name: erp_stock_card_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_stock_card_id_seq OWNED BY public.erp_stock_card.id;


--
-- Name: erp_stock_movement; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_stock_movement (
    id integer NOT NULL,
    product_id integer NOT NULL,
    movement_type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    unit_cost bigint NOT NULL,
    total_cost bigint NOT NULL,
    reference_type character varying(20),
    reference_id character varying(50),
    notes text,
    movement_date date NOT NULL,
    balance_before integer,
    balance_after integer,
    performed_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_stock_movement OWNER TO salon;

--
-- Name: COLUMN erp_stock_movement.movement_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.movement_type IS 'IN / OUT / ADJUSTMENT / OPNAME';


--
-- Name: COLUMN erp_stock_movement.quantity; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.quantity IS 'Jumlah: positif untuk IN, negatif untuk OUT';


--
-- Name: COLUMN erp_stock_movement.unit_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.unit_cost IS 'Harga satuan saat movement';


--
-- Name: COLUMN erp_stock_movement.total_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.total_cost IS 'quantity * unit_cost';


--
-- Name: COLUMN erp_stock_movement.reference_type; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.reference_type IS 'PURCHASE / TREATMENT / SALE / OPNAME / ADJUSTMENT';


--
-- Name: COLUMN erp_stock_movement.reference_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.reference_id IS 'ID dokumen referensi (POS, TRM, STK)';


--
-- Name: COLUMN erp_stock_movement.movement_date; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.movement_date IS 'Tanggal pergerakan';


--
-- Name: COLUMN erp_stock_movement.balance_before; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.balance_before IS 'Stok sebelum movement';


--
-- Name: COLUMN erp_stock_movement.balance_after; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_movement.balance_after IS 'Stok setelah movement';


--
-- Name: erp_stock_movement_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_stock_movement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_stock_movement_id_seq OWNER TO salon;

--
-- Name: erp_stock_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_stock_movement_id_seq OWNED BY public.erp_stock_movement.id;


--
-- Name: erp_stock_opname; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_stock_opname (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    opname_date date NOT NULL,
    status character varying(20) NOT NULL,
    total_items integer NOT NULL,
    total_difference bigint NOT NULL,
    notes text,
    completed_at timestamp without time zone,
    completed_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_stock_opname OWNER TO salon;

--
-- Name: COLUMN erp_stock_opname.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname.code IS 'Kode opname, e.g. OPN-20260518-001';


--
-- Name: COLUMN erp_stock_opname.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname.status IS 'DRAFT / COMPLETED / CANCELLED';


--
-- Name: COLUMN erp_stock_opname.total_difference; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname.total_difference IS 'Total selisih rupiah';


--
-- Name: erp_stock_opname_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_stock_opname_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_stock_opname_id_seq OWNER TO salon;

--
-- Name: erp_stock_opname_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_stock_opname_id_seq OWNED BY public.erp_stock_opname.id;


--
-- Name: erp_stock_opname_item; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_stock_opname_item (
    id integer NOT NULL,
    opname_id integer NOT NULL,
    product_id integer NOT NULL,
    system_qty integer NOT NULL,
    physical_qty integer NOT NULL,
    difference integer NOT NULL,
    unit_cost bigint NOT NULL,
    difference_value bigint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_stock_opname_item OWNER TO salon;

--
-- Name: COLUMN erp_stock_opname_item.system_qty; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname_item.system_qty IS 'Stok menurut sistem';


--
-- Name: COLUMN erp_stock_opname_item.physical_qty; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname_item.physical_qty IS 'Stok fisik hasil hitungan';


--
-- Name: COLUMN erp_stock_opname_item.difference; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname_item.difference IS 'physical_qty - system_qty';


--
-- Name: COLUMN erp_stock_opname_item.unit_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname_item.unit_cost IS 'Harga satuan produk';


--
-- Name: COLUMN erp_stock_opname_item.difference_value; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_stock_opname_item.difference_value IS 'difference * unit_cost';


--
-- Name: erp_stock_opname_item_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_stock_opname_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_stock_opname_item_id_seq OWNER TO salon;

--
-- Name: erp_stock_opname_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_stock_opname_item_id_seq OWNED BY public.erp_stock_opname_item.id;


--
-- Name: erp_treatment_record; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_treatment_record (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    transaction_id character varying(50),
    customer_id integer,
    customer_name character varying(200) NOT NULL,
    customer_phone character varying(50),
    therapist_id integer,
    therapist_name character varying(200) NOT NULL,
    services jsonb NOT NULL,
    assigned_bed character varying(50),
    status character varying(20) NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    before_photos jsonb,
    after_photos jsonb,
    therapist_notes text,
    total_price bigint NOT NULL,
    discount bigint NOT NULL,
    sync_status character varying(20) NOT NULL,
    synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_treatment_record OWNER TO salon;

--
-- Name: COLUMN erp_treatment_record.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.code IS 'Kode Treatment Record: TRM-001-YYYYMMDD-NNNN';


--
-- Name: COLUMN erp_treatment_record.transaction_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.transaction_id IS 'ID/Code transaksi POS terkait (nullable untuk walk-in tanpa transaksi)';


--
-- Name: COLUMN erp_treatment_record.customer_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.customer_id IS 'ID dari ErpMasterCustomer (nullable untuk customer baru)';


--
-- Name: COLUMN erp_treatment_record.customer_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.customer_name IS 'Nama customer (copy dari master atau input langsung)';


--
-- Name: COLUMN erp_treatment_record.customer_phone; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.customer_phone IS 'Nomor telepon customer';


--
-- Name: COLUMN erp_treatment_record.therapist_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.therapist_id IS 'ID dari ErpMasterStaff (nullable untuk walk-in)';


--
-- Name: COLUMN erp_treatment_record.therapist_name; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.therapist_name IS 'Nama terapis yang menangani';


--
-- Name: COLUMN erp_treatment_record.services; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.services IS 'JSON array: [{id, name, price, duration}] — daftar layanan';


--
-- Name: COLUMN erp_treatment_record.assigned_bed; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.assigned_bed IS 'Nomor bed yang digunakan (e.g. ''Bed 1'', ''Bed 2'')';


--
-- Name: COLUMN erp_treatment_record.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.status IS 'PENDING / IN_PROGRESS / COMPLETED';


--
-- Name: COLUMN erp_treatment_record.started_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.started_at IS 'Waktu treatment dimulai (saat terapis klik Mulai)';


--
-- Name: COLUMN erp_treatment_record.completed_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.completed_at IS 'Waktu treatment selesai (saat terapis klik Selesai)';


--
-- Name: COLUMN erp_treatment_record.before_photos; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.before_photos IS 'JSON array of photo URLs — foto sebelum treatment';


--
-- Name: COLUMN erp_treatment_record.after_photos; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.after_photos IS 'JSON array of photo URLs — foto sesudah treatment';


--
-- Name: COLUMN erp_treatment_record.therapist_notes; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.therapist_notes IS 'Catatan terapis selama/setelah treatment';


--
-- Name: COLUMN erp_treatment_record.total_price; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.total_price IS 'Total harga treatment (dalam rupiah)';


--
-- Name: COLUMN erp_treatment_record.discount; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.discount IS 'Diskon (dalam rupiah)';


--
-- Name: COLUMN erp_treatment_record.sync_status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.sync_status IS 'PENDING / SYNCED / FAILED — status sinkronisasi ke ERP';


--
-- Name: COLUMN erp_treatment_record.synced_at; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_treatment_record.synced_at IS 'Timestamp sinkronisasi ke ERP';


--
-- Name: erp_treatment_record_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_treatment_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_treatment_record_id_seq OWNER TO salon;

--
-- Name: erp_treatment_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_treatment_record_id_seq OWNED BY public.erp_treatment_record.id;


--
-- Name: erp_wip_material; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_wip_material (
    id integer NOT NULL,
    wip_id integer NOT NULL,
    product_id integer NOT NULL,
    planned_qty integer NOT NULL,
    actual_qty integer,
    unit_cost bigint NOT NULL,
    subtotal bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_wip_material OWNER TO salon;

--
-- Name: COLUMN erp_wip_material.product_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_wip_material.product_id IS 'Bahan baku yang digunakan';


--
-- Name: COLUMN erp_wip_material.actual_qty; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_wip_material.actual_qty IS 'Pemakaian aktual';


--
-- Name: COLUMN erp_wip_material.subtotal; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_wip_material.subtotal IS 'actual_qty * unit_cost';


--
-- Name: erp_wip_material_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_wip_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_wip_material_id_seq OWNER TO salon;

--
-- Name: erp_wip_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_wip_material_id_seq OWNED BY public.erp_wip_material.id;


--
-- Name: erp_work_in_progress; Type: TABLE; Schema: public; Owner: salon
--

CREATE TABLE public.erp_work_in_progress (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    product_id integer NOT NULL,
    batch_number character varying(50),
    planned_qty integer NOT NULL,
    actual_qty integer,
    status character varying(20) NOT NULL,
    start_date date,
    end_date date,
    total_material_cost bigint NOT NULL,
    total_labor_cost bigint NOT NULL,
    total_overhead_cost bigint NOT NULL,
    total_cost bigint NOT NULL,
    notes text,
    completed_by character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.erp_work_in_progress OWNER TO salon;

--
-- Name: COLUMN erp_work_in_progress.code; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.code IS 'Kode WIP, e.g. WIP-BATCH-001';


--
-- Name: COLUMN erp_work_in_progress.product_id; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.product_id IS 'Produk yang diproduksi (barang jadi)';


--
-- Name: COLUMN erp_work_in_progress.batch_number; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.batch_number IS 'Nomor batch produksi';


--
-- Name: COLUMN erp_work_in_progress.planned_qty; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.planned_qty IS 'Jumlah yang direncanakan';


--
-- Name: COLUMN erp_work_in_progress.actual_qty; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.actual_qty IS 'Jumlah aktual yang dihasilkan';


--
-- Name: COLUMN erp_work_in_progress.status; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.status IS 'PLANNED / IN_PROGRESS / COMPLETED / CANCELLED';


--
-- Name: COLUMN erp_work_in_progress.total_material_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.total_material_cost IS 'Biaya bahan baku';


--
-- Name: COLUMN erp_work_in_progress.total_labor_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.total_labor_cost IS 'Biaya tenaga kerja';


--
-- Name: COLUMN erp_work_in_progress.total_overhead_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.total_overhead_cost IS 'Biaya overhead';


--
-- Name: COLUMN erp_work_in_progress.total_cost; Type: COMMENT; Schema: public; Owner: salon
--

COMMENT ON COLUMN public.erp_work_in_progress.total_cost IS 'Total biaya produksi';


--
-- Name: erp_work_in_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: salon
--

CREATE SEQUENCE public.erp_work_in_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.erp_work_in_progress_id_seq OWNER TO salon;

--
-- Name: erp_work_in_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: salon
--

ALTER SEQUENCE public.erp_work_in_progress_id_seq OWNED BY public.erp_work_in_progress.id;


--
-- Name: erp_account_mapping id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_account_mapping ALTER COLUMN id SET DEFAULT nextval('public.erp_account_mapping_id_seq'::regclass);


--
-- Name: erp_asset_depreciation id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_asset_depreciation ALTER COLUMN id SET DEFAULT nextval('public.erp_asset_depreciation_id_seq'::regclass);


--
-- Name: erp_audit_log id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_audit_log ALTER COLUMN id SET DEFAULT nextval('public.erp_audit_log_id_seq'::regclass);


--
-- Name: erp_bank_account id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_account ALTER COLUMN id SET DEFAULT nextval('public.erp_bank_account_id_seq'::regclass);


--
-- Name: erp_bank_transaction id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_transaction ALTER COLUMN id SET DEFAULT nextval('public.erp_bank_transaction_id_seq'::regclass);


--
-- Name: erp_bill_of_material id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bill_of_material ALTER COLUMN id SET DEFAULT nextval('public.erp_bill_of_material_id_seq'::regclass);


--
-- Name: erp_bom_component id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bom_component ALTER COLUMN id SET DEFAULT nextval('public.erp_bom_component_id_seq'::regclass);


--
-- Name: erp_booking_record id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_booking_record ALTER COLUMN id SET DEFAULT nextval('public.erp_booking_record_id_seq'::regclass);


--
-- Name: erp_doc_cross_reference id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_cross_reference ALTER COLUMN id SET DEFAULT nextval('public.erp_doc_cross_reference_id_seq'::regclass);


--
-- Name: erp_doc_sequence id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_sequence ALTER COLUMN id SET DEFAULT nextval('public.erp_doc_sequence_id_seq'::regclass);


--
-- Name: erp_document_registry id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_document_registry ALTER COLUMN id SET DEFAULT nextval('public.erp_document_registry_id_seq'::regclass);


--
-- Name: erp_financial_period id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_financial_period ALTER COLUMN id SET DEFAULT nextval('public.erp_financial_period_id_seq'::regclass);


--
-- Name: erp_fixed_asset id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_fixed_asset ALTER COLUMN id SET DEFAULT nextval('public.erp_fixed_asset_id_seq'::regclass);


--
-- Name: erp_journal_entry id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_entry ALTER COLUMN id SET DEFAULT nextval('public.erp_journal_entry_id_seq'::regclass);


--
-- Name: erp_journal_line id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_line ALTER COLUMN id SET DEFAULT nextval('public.erp_journal_line_id_seq'::regclass);


--
-- Name: erp_master_account id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_account ALTER COLUMN id SET DEFAULT nextval('public.erp_master_account_id_seq'::regclass);


--
-- Name: erp_master_bed id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_bed ALTER COLUMN id SET DEFAULT nextval('public.erp_master_bed_id_seq'::regclass);


--
-- Name: erp_master_branch id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_branch ALTER COLUMN id SET DEFAULT nextval('public.erp_master_branch_id_seq'::regclass);


--
-- Name: erp_master_category id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_category ALTER COLUMN id SET DEFAULT nextval('public.erp_master_category_id_seq'::regclass);


--
-- Name: erp_master_company id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_company ALTER COLUMN id SET DEFAULT nextval('public.erp_master_company_id_seq'::regclass);


--
-- Name: erp_master_customer id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_customer ALTER COLUMN id SET DEFAULT nextval('public.erp_master_customer_id_seq'::regclass);


--
-- Name: erp_master_product id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_product ALTER COLUMN id SET DEFAULT nextval('public.erp_master_product_id_seq'::regclass);


--
-- Name: erp_master_service id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_service ALTER COLUMN id SET DEFAULT nextval('public.erp_master_service_id_seq'::regclass);


--
-- Name: erp_master_staff id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_staff ALTER COLUMN id SET DEFAULT nextval('public.erp_master_staff_id_seq'::regclass);


--
-- Name: erp_master_supplier id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_supplier ALTER COLUMN id SET DEFAULT nextval('public.erp_master_supplier_id_seq'::regclass);


--
-- Name: erp_master_tax id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_tax ALTER COLUMN id SET DEFAULT nextval('public.erp_master_tax_id_seq'::regclass);


--
-- Name: erp_master_voucher id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_voucher ALTER COLUMN id SET DEFAULT nextval('public.erp_master_voucher_id_seq'::regclass);


--
-- Name: erp_period_close_log id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_period_close_log ALTER COLUMN id SET DEFAULT nextval('public.erp_period_close_log_id_seq'::regclass);


--
-- Name: erp_pos_session id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_session ALTER COLUMN id SET DEFAULT nextval('public.erp_pos_session_id_seq'::regclass);


--
-- Name: erp_pos_settlement id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_settlement ALTER COLUMN id SET DEFAULT nextval('public.erp_pos_settlement_id_seq'::regclass);


--
-- Name: erp_pos_transaction_sync id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_transaction_sync ALTER COLUMN id SET DEFAULT nextval('public.erp_pos_transaction_sync_id_seq'::regclass);


--
-- Name: erp_posting_line id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_line ALTER COLUMN id SET DEFAULT nextval('public.erp_posting_line_id_seq'::regclass);


--
-- Name: erp_posting_rule id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_rule ALTER COLUMN id SET DEFAULT nextval('public.erp_posting_rule_id_seq'::regclass);


--
-- Name: erp_posting_transaction id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_transaction ALTER COLUMN id SET DEFAULT nextval('public.erp_posting_transaction_id_seq'::regclass);


--
-- Name: erp_purchase_order id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order ALTER COLUMN id SET DEFAULT nextval('public.erp_purchase_order_id_seq'::regclass);


--
-- Name: erp_purchase_order_item id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order_item ALTER COLUMN id SET DEFAULT nextval('public.erp_purchase_order_item_id_seq'::regclass);


--
-- Name: erp_sales_order id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order ALTER COLUMN id SET DEFAULT nextval('public.erp_sales_order_id_seq'::regclass);


--
-- Name: erp_sales_order_item id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order_item ALTER COLUMN id SET DEFAULT nextval('public.erp_sales_order_item_id_seq'::regclass);


--
-- Name: erp_stock_card id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_card ALTER COLUMN id SET DEFAULT nextval('public.erp_stock_card_id_seq'::regclass);


--
-- Name: erp_stock_movement id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_movement ALTER COLUMN id SET DEFAULT nextval('public.erp_stock_movement_id_seq'::regclass);


--
-- Name: erp_stock_opname id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname ALTER COLUMN id SET DEFAULT nextval('public.erp_stock_opname_id_seq'::regclass);


--
-- Name: erp_stock_opname_item id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname_item ALTER COLUMN id SET DEFAULT nextval('public.erp_stock_opname_item_id_seq'::regclass);


--
-- Name: erp_treatment_record id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_treatment_record ALTER COLUMN id SET DEFAULT nextval('public.erp_treatment_record_id_seq'::regclass);


--
-- Name: erp_wip_material id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_wip_material ALTER COLUMN id SET DEFAULT nextval('public.erp_wip_material_id_seq'::regclass);


--
-- Name: erp_work_in_progress id; Type: DEFAULT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_work_in_progress ALTER COLUMN id SET DEFAULT nextval('public.erp_work_in_progress_id_seq'::regclass);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: Commission Commission_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Commission"
    ADD CONSTRAINT "Commission_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PosSession PosSession_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."PosSession"
    ADD CONSTRAINT "PosSession_code_key" UNIQUE (code);


--
-- Name: PosSession PosSession_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."PosSession"
    ADD CONSTRAINT "PosSession_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Service Service_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Service"
    ADD CONSTRAINT "Service_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: TransactionItem TransactionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."TransactionItem"
    ADD CONSTRAINT "TransactionItem_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: TreatmentRecord TreatmentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."TreatmentRecord"
    ADD CONSTRAINT "TreatmentRecord_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: erp_account_mapping erp_account_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_account_mapping
    ADD CONSTRAINT erp_account_mapping_pkey PRIMARY KEY (id);


--
-- Name: erp_asset_depreciation erp_asset_depreciation_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_asset_depreciation
    ADD CONSTRAINT erp_asset_depreciation_pkey PRIMARY KEY (id);


--
-- Name: erp_audit_log erp_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_audit_log
    ADD CONSTRAINT erp_audit_log_pkey PRIMARY KEY (id);


--
-- Name: erp_bank_account erp_bank_account_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_account
    ADD CONSTRAINT erp_bank_account_pkey PRIMARY KEY (id);


--
-- Name: erp_bank_transaction erp_bank_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_transaction
    ADD CONSTRAINT erp_bank_transaction_pkey PRIMARY KEY (id);


--
-- Name: erp_bill_of_material erp_bill_of_material_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bill_of_material
    ADD CONSTRAINT erp_bill_of_material_code_key UNIQUE (code);


--
-- Name: erp_bill_of_material erp_bill_of_material_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bill_of_material
    ADD CONSTRAINT erp_bill_of_material_pkey PRIMARY KEY (id);


--
-- Name: erp_bom_component erp_bom_component_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bom_component
    ADD CONSTRAINT erp_bom_component_pkey PRIMARY KEY (id);


--
-- Name: erp_booking_record erp_booking_record_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_booking_record
    ADD CONSTRAINT erp_booking_record_pkey PRIMARY KEY (id);


--
-- Name: erp_doc_cross_reference erp_doc_cross_reference_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_cross_reference
    ADD CONSTRAINT erp_doc_cross_reference_pkey PRIMARY KEY (id);


--
-- Name: erp_doc_sequence erp_doc_sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_sequence
    ADD CONSTRAINT erp_doc_sequence_pkey PRIMARY KEY (id);


--
-- Name: erp_document_registry erp_document_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_document_registry
    ADD CONSTRAINT erp_document_registry_pkey PRIMARY KEY (id);


--
-- Name: erp_financial_period erp_financial_period_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_financial_period
    ADD CONSTRAINT erp_financial_period_code_key UNIQUE (code);


--
-- Name: erp_financial_period erp_financial_period_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_financial_period
    ADD CONSTRAINT erp_financial_period_pkey PRIMARY KEY (id);


--
-- Name: erp_fixed_asset erp_fixed_asset_asset_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_fixed_asset
    ADD CONSTRAINT erp_fixed_asset_asset_code_key UNIQUE (asset_code);


--
-- Name: erp_fixed_asset erp_fixed_asset_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_fixed_asset
    ADD CONSTRAINT erp_fixed_asset_pkey PRIMARY KEY (id);


--
-- Name: erp_journal_entry erp_journal_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_entry
    ADD CONSTRAINT erp_journal_entry_pkey PRIMARY KEY (id);


--
-- Name: erp_journal_line erp_journal_line_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_line
    ADD CONSTRAINT erp_journal_line_pkey PRIMARY KEY (id);


--
-- Name: erp_master_account erp_master_account_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_account
    ADD CONSTRAINT erp_master_account_code_key UNIQUE (code);


--
-- Name: erp_master_account erp_master_account_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_account
    ADD CONSTRAINT erp_master_account_pkey PRIMARY KEY (id);


--
-- Name: erp_master_bed erp_master_bed_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_bed
    ADD CONSTRAINT erp_master_bed_pkey PRIMARY KEY (id);


--
-- Name: erp_master_branch erp_master_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_branch
    ADD CONSTRAINT erp_master_branch_code_key UNIQUE (code);


--
-- Name: erp_master_branch erp_master_branch_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_branch
    ADD CONSTRAINT erp_master_branch_pkey PRIMARY KEY (id);


--
-- Name: erp_master_category erp_master_category_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_category
    ADD CONSTRAINT erp_master_category_pkey PRIMARY KEY (id);


--
-- Name: erp_master_company erp_master_company_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_company
    ADD CONSTRAINT erp_master_company_pkey PRIMARY KEY (id);


--
-- Name: erp_master_customer erp_master_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_customer
    ADD CONSTRAINT erp_master_customer_pkey PRIMARY KEY (id);


--
-- Name: erp_master_product erp_master_product_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_product
    ADD CONSTRAINT erp_master_product_pkey PRIMARY KEY (id);


--
-- Name: erp_master_product erp_master_product_sku_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_product
    ADD CONSTRAINT erp_master_product_sku_key UNIQUE (sku);


--
-- Name: erp_master_service erp_master_service_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_service
    ADD CONSTRAINT erp_master_service_pkey PRIMARY KEY (id);


--
-- Name: erp_master_staff erp_master_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_staff
    ADD CONSTRAINT erp_master_staff_pkey PRIMARY KEY (id);


--
-- Name: erp_master_supplier erp_master_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_supplier
    ADD CONSTRAINT erp_master_supplier_pkey PRIMARY KEY (id);


--
-- Name: erp_master_tax erp_master_tax_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_tax
    ADD CONSTRAINT erp_master_tax_pkey PRIMARY KEY (id);


--
-- Name: erp_master_voucher erp_master_voucher_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_voucher
    ADD CONSTRAINT erp_master_voucher_code_key UNIQUE (code);


--
-- Name: erp_master_voucher erp_master_voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_voucher
    ADD CONSTRAINT erp_master_voucher_pkey PRIMARY KEY (id);


--
-- Name: erp_period_close_log erp_period_close_log_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_period_close_log
    ADD CONSTRAINT erp_period_close_log_pkey PRIMARY KEY (id);


--
-- Name: erp_pos_session erp_pos_session_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_session
    ADD CONSTRAINT erp_pos_session_pkey PRIMARY KEY (id);


--
-- Name: erp_pos_settlement erp_pos_settlement_doc_key_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_settlement
    ADD CONSTRAINT erp_pos_settlement_doc_key_key UNIQUE (doc_key);


--
-- Name: erp_pos_settlement erp_pos_settlement_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_settlement
    ADD CONSTRAINT erp_pos_settlement_pkey PRIMARY KEY (id);


--
-- Name: erp_pos_transaction_sync erp_pos_transaction_sync_doc_key_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_transaction_sync
    ADD CONSTRAINT erp_pos_transaction_sync_doc_key_key UNIQUE (doc_key);


--
-- Name: erp_pos_transaction_sync erp_pos_transaction_sync_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_pos_transaction_sync
    ADD CONSTRAINT erp_pos_transaction_sync_pkey PRIMARY KEY (id);


--
-- Name: erp_posting_line erp_posting_line_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_line
    ADD CONSTRAINT erp_posting_line_pkey PRIMARY KEY (id);


--
-- Name: erp_posting_rule erp_posting_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_rule
    ADD CONSTRAINT erp_posting_rule_pkey PRIMARY KEY (id);


--
-- Name: erp_posting_transaction erp_posting_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_transaction
    ADD CONSTRAINT erp_posting_transaction_pkey PRIMARY KEY (id);


--
-- Name: erp_purchase_order_item erp_purchase_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order_item
    ADD CONSTRAINT erp_purchase_order_item_pkey PRIMARY KEY (id);


--
-- Name: erp_purchase_order erp_purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order
    ADD CONSTRAINT erp_purchase_order_pkey PRIMARY KEY (id);


--
-- Name: erp_sales_order_item erp_sales_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order_item
    ADD CONSTRAINT erp_sales_order_item_pkey PRIMARY KEY (id);


--
-- Name: erp_sales_order erp_sales_order_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order
    ADD CONSTRAINT erp_sales_order_pkey PRIMARY KEY (id);


--
-- Name: erp_stock_card erp_stock_card_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_card
    ADD CONSTRAINT erp_stock_card_pkey PRIMARY KEY (id);


--
-- Name: erp_stock_movement erp_stock_movement_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_movement
    ADD CONSTRAINT erp_stock_movement_pkey PRIMARY KEY (id);


--
-- Name: erp_stock_opname erp_stock_opname_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname
    ADD CONSTRAINT erp_stock_opname_code_key UNIQUE (code);


--
-- Name: erp_stock_opname_item erp_stock_opname_item_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname_item
    ADD CONSTRAINT erp_stock_opname_item_pkey PRIMARY KEY (id);


--
-- Name: erp_stock_opname erp_stock_opname_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname
    ADD CONSTRAINT erp_stock_opname_pkey PRIMARY KEY (id);


--
-- Name: erp_treatment_record erp_treatment_record_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_treatment_record
    ADD CONSTRAINT erp_treatment_record_pkey PRIMARY KEY (id);


--
-- Name: erp_wip_material erp_wip_material_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_wip_material
    ADD CONSTRAINT erp_wip_material_pkey PRIMARY KEY (id);


--
-- Name: erp_work_in_progress erp_work_in_progress_code_key; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_work_in_progress
    ADD CONSTRAINT erp_work_in_progress_code_key UNIQUE (code);


--
-- Name: erp_work_in_progress erp_work_in_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_work_in_progress
    ADD CONSTRAINT erp_work_in_progress_pkey PRIMARY KEY (id);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: Transaction_code_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX "Transaction_code_key" ON public."Transaction" USING btree (code);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: idx_account_mapping_type; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX idx_account_mapping_type ON public.erp_account_mapping USING btree (transaction_type);


--
-- Name: ix_public_erp_asset_depreciation_asset_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_asset_depreciation_asset_id ON public.erp_asset_depreciation USING btree (asset_id);


--
-- Name: ix_public_erp_audit_log_action; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_audit_log_action ON public.erp_audit_log USING btree (action);


--
-- Name: ix_public_erp_audit_log_performed_by; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_audit_log_performed_by ON public.erp_audit_log USING btree (performed_by);


--
-- Name: ix_public_erp_audit_log_record_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_audit_log_record_id ON public.erp_audit_log USING btree (record_id);


--
-- Name: ix_public_erp_audit_log_table_name; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_audit_log_table_name ON public.erp_audit_log USING btree (table_name);


--
-- Name: ix_public_erp_bank_transaction_bank_account_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_bank_transaction_bank_account_id ON public.erp_bank_transaction USING btree (bank_account_id);


--
-- Name: ix_public_erp_bom_component_bom_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_bom_component_bom_id ON public.erp_bom_component USING btree (bom_id);


--
-- Name: ix_public_erp_booking_record_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_booking_record_code ON public.erp_booking_record USING btree (code);


--
-- Name: ix_public_erp_booking_record_transaction_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_booking_record_transaction_id ON public.erp_booking_record USING btree (transaction_id);


--
-- Name: ix_public_erp_doc_cross_reference_source_doc_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_doc_cross_reference_source_doc_key ON public.erp_doc_cross_reference USING btree (source_doc_key);


--
-- Name: ix_public_erp_doc_cross_reference_target_doc_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_doc_cross_reference_target_doc_key ON public.erp_doc_cross_reference USING btree (target_doc_key);


--
-- Name: ix_public_erp_doc_sequence_module; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_doc_sequence_module ON public.erp_doc_sequence USING btree (module);


--
-- Name: ix_public_erp_document_registry_doc_date; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_document_registry_doc_date ON public.erp_document_registry USING btree (doc_date);


--
-- Name: ix_public_erp_document_registry_doc_key; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_document_registry_doc_key ON public.erp_document_registry USING btree (doc_key);


--
-- Name: ix_public_erp_document_registry_module; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_document_registry_module ON public.erp_document_registry USING btree (module);


--
-- Name: ix_public_erp_journal_entry_je_number; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_journal_entry_je_number ON public.erp_journal_entry USING btree (je_number);


--
-- Name: ix_public_erp_journal_entry_transaction_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_journal_entry_transaction_id ON public.erp_journal_entry USING btree (transaction_id);


--
-- Name: ix_public_erp_journal_line_journal_entry_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_journal_line_journal_entry_id ON public.erp_journal_line USING btree (journal_entry_id);


--
-- Name: ix_public_erp_period_close_log_period_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_period_close_log_period_id ON public.erp_period_close_log USING btree (period_id);


--
-- Name: ix_public_erp_pos_session_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_pos_session_code ON public.erp_pos_session USING btree (code);


--
-- Name: ix_public_erp_pos_settlement_pos_session_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_pos_settlement_pos_session_id ON public.erp_pos_settlement USING btree (pos_session_id);


--
-- Name: ix_public_erp_pos_settlement_session_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_pos_settlement_session_code ON public.erp_pos_settlement USING btree (session_code);


--
-- Name: ix_public_erp_pos_transaction_sync_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_pos_transaction_sync_code ON public.erp_pos_transaction_sync USING btree (code);


--
-- Name: ix_public_erp_pos_transaction_sync_date; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_pos_transaction_sync_date ON public.erp_pos_transaction_sync USING btree (date);


--
-- Name: ix_public_erp_pos_transaction_sync_pos_transaction_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_pos_transaction_sync_pos_transaction_id ON public.erp_pos_transaction_sync USING btree (pos_transaction_id);


--
-- Name: ix_public_erp_posting_line_transaction_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_posting_line_transaction_id ON public.erp_posting_line USING btree (transaction_id);


--
-- Name: ix_public_erp_posting_rule_transaction_type; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_posting_rule_transaction_type ON public.erp_posting_rule USING btree (transaction_type);


--
-- Name: ix_public_erp_posting_transaction_doc_number; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_posting_transaction_doc_number ON public.erp_posting_transaction USING btree (doc_number);


--
-- Name: ix_public_erp_posting_transaction_transaction_type; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_posting_transaction_transaction_type ON public.erp_posting_transaction USING btree (transaction_type);


--
-- Name: ix_public_erp_purchase_order_item_product_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_purchase_order_item_product_id ON public.erp_purchase_order_item USING btree (product_id);


--
-- Name: ix_public_erp_purchase_order_item_purchase_order_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_purchase_order_item_purchase_order_id ON public.erp_purchase_order_item USING btree (purchase_order_id);


--
-- Name: ix_public_erp_purchase_order_po_number; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_purchase_order_po_number ON public.erp_purchase_order USING btree (po_number);


--
-- Name: ix_public_erp_purchase_order_status; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_purchase_order_status ON public.erp_purchase_order USING btree (status);


--
-- Name: ix_public_erp_purchase_order_supplier_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_purchase_order_supplier_id ON public.erp_purchase_order USING btree (supplier_id);


--
-- Name: ix_public_erp_sales_order_customer_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_sales_order_customer_id ON public.erp_sales_order USING btree (customer_id);


--
-- Name: ix_public_erp_sales_order_item_product_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_sales_order_item_product_id ON public.erp_sales_order_item USING btree (product_id);


--
-- Name: ix_public_erp_sales_order_item_sales_order_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_sales_order_item_sales_order_id ON public.erp_sales_order_item USING btree (sales_order_id);


--
-- Name: ix_public_erp_sales_order_sales_number; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_sales_order_sales_number ON public.erp_sales_order USING btree (sales_number);


--
-- Name: ix_public_erp_sales_order_status; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_sales_order_status ON public.erp_sales_order USING btree (status);


--
-- Name: ix_public_erp_stock_card_period_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_stock_card_period_code ON public.erp_stock_card USING btree (period_code);


--
-- Name: ix_public_erp_stock_card_product_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_stock_card_product_id ON public.erp_stock_card USING btree (product_id);


--
-- Name: ix_public_erp_stock_movement_movement_type; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_stock_movement_movement_type ON public.erp_stock_movement USING btree (movement_type);


--
-- Name: ix_public_erp_stock_movement_product_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_stock_movement_product_id ON public.erp_stock_movement USING btree (product_id);


--
-- Name: ix_public_erp_stock_opname_item_opname_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_stock_opname_item_opname_id ON public.erp_stock_opname_item USING btree (opname_id);


--
-- Name: ix_public_erp_treatment_record_code; Type: INDEX; Schema: public; Owner: salon
--

CREATE UNIQUE INDEX ix_public_erp_treatment_record_code ON public.erp_treatment_record USING btree (code);


--
-- Name: ix_public_erp_treatment_record_transaction_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_treatment_record_transaction_id ON public.erp_treatment_record USING btree (transaction_id);


--
-- Name: ix_public_erp_wip_material_wip_id; Type: INDEX; Schema: public; Owner: salon
--

CREATE INDEX ix_public_erp_wip_material_wip_id ON public.erp_wip_material USING btree (wip_id);


--
-- Name: Booking Booking_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Booking Booking_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public."Service"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Booking Booking_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Commission Commission_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Commission"
    ADD CONSTRAINT "Commission_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Commission Commission_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Commission"
    ADD CONSTRAINT "Commission_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockMovement StockMovement_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransactionItem TransactionItem_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."TransactionItem"
    ADD CONSTRAINT "TransactionItem_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TransactionItem TransactionItem_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."TransactionItem"
    ADD CONSTRAINT "TransactionItem_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public."PosSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: erp_account_mapping erp_account_mapping_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_account_mapping
    ADD CONSTRAINT erp_account_mapping_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.erp_master_account(id);


--
-- Name: erp_asset_depreciation erp_asset_depreciation_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_asset_depreciation
    ADD CONSTRAINT erp_asset_depreciation_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.erp_fixed_asset(id);


--
-- Name: erp_asset_depreciation erp_asset_depreciation_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_asset_depreciation
    ADD CONSTRAINT erp_asset_depreciation_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.erp_journal_entry(id);


--
-- Name: erp_bank_account erp_bank_account_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_account
    ADD CONSTRAINT erp_bank_account_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.erp_master_branch(id);


--
-- Name: erp_bank_transaction erp_bank_transaction_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_transaction
    ADD CONSTRAINT erp_bank_transaction_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.erp_bank_account(id);


--
-- Name: erp_bank_transaction erp_bank_transaction_transfer_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bank_transaction
    ADD CONSTRAINT erp_bank_transaction_transfer_to_account_id_fkey FOREIGN KEY (transfer_to_account_id) REFERENCES public.erp_bank_account(id);


--
-- Name: erp_bill_of_material erp_bill_of_material_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bill_of_material
    ADD CONSTRAINT erp_bill_of_material_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_bom_component erp_bom_component_bom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bom_component
    ADD CONSTRAINT erp_bom_component_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.erp_bill_of_material(id);


--
-- Name: erp_bom_component erp_bom_component_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_bom_component
    ADD CONSTRAINT erp_bom_component_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_doc_cross_reference erp_doc_cross_reference_source_doc_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_cross_reference
    ADD CONSTRAINT erp_doc_cross_reference_source_doc_key_fkey FOREIGN KEY (source_doc_key) REFERENCES public.erp_document_registry(doc_key);


--
-- Name: erp_doc_cross_reference erp_doc_cross_reference_target_doc_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_doc_cross_reference
    ADD CONSTRAINT erp_doc_cross_reference_target_doc_key_fkey FOREIGN KEY (target_doc_key) REFERENCES public.erp_document_registry(doc_key);


--
-- Name: erp_fixed_asset erp_fixed_asset_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_fixed_asset
    ADD CONSTRAINT erp_fixed_asset_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.erp_master_branch(id);


--
-- Name: erp_journal_entry erp_journal_entry_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_entry
    ADD CONSTRAINT erp_journal_entry_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.erp_financial_period(id);


--
-- Name: erp_journal_entry erp_journal_entry_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_entry
    ADD CONSTRAINT erp_journal_entry_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.erp_posting_transaction(id);


--
-- Name: erp_journal_line erp_journal_line_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_line
    ADD CONSTRAINT erp_journal_line_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.erp_master_account(id);


--
-- Name: erp_journal_line erp_journal_line_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_journal_line
    ADD CONSTRAINT erp_journal_line_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.erp_journal_entry(id);


--
-- Name: erp_master_account erp_master_account_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_account
    ADD CONSTRAINT erp_master_account_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.erp_master_account(id);


--
-- Name: erp_master_category erp_master_category_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_master_category
    ADD CONSTRAINT erp_master_category_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.erp_master_category(id);


--
-- Name: erp_period_close_log erp_period_close_log_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_period_close_log
    ADD CONSTRAINT erp_period_close_log_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.erp_financial_period(id);


--
-- Name: erp_posting_line erp_posting_line_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_line
    ADD CONSTRAINT erp_posting_line_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_posting_line erp_posting_line_tax_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_line
    ADD CONSTRAINT erp_posting_line_tax_id_fkey FOREIGN KEY (tax_id) REFERENCES public.erp_master_tax(id);


--
-- Name: erp_posting_line erp_posting_line_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_line
    ADD CONSTRAINT erp_posting_line_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.erp_posting_transaction(id);


--
-- Name: erp_posting_rule erp_posting_rule_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_rule
    ADD CONSTRAINT erp_posting_rule_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.erp_master_account(id);


--
-- Name: erp_posting_transaction erp_posting_transaction_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_posting_transaction
    ADD CONSTRAINT erp_posting_transaction_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.erp_financial_period(id);


--
-- Name: erp_purchase_order_item erp_purchase_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order_item
    ADD CONSTRAINT erp_purchase_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_purchase_order_item erp_purchase_order_item_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order_item
    ADD CONSTRAINT erp_purchase_order_item_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.erp_purchase_order(id);


--
-- Name: erp_purchase_order erp_purchase_order_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_purchase_order
    ADD CONSTRAINT erp_purchase_order_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.erp_master_supplier(id);


--
-- Name: erp_sales_order erp_sales_order_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order
    ADD CONSTRAINT erp_sales_order_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.erp_master_customer(id);


--
-- Name: erp_sales_order_item erp_sales_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order_item
    ADD CONSTRAINT erp_sales_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_sales_order_item erp_sales_order_item_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_sales_order_item
    ADD CONSTRAINT erp_sales_order_item_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.erp_sales_order(id);


--
-- Name: erp_stock_card erp_stock_card_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_card
    ADD CONSTRAINT erp_stock_card_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_stock_movement erp_stock_movement_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_movement
    ADD CONSTRAINT erp_stock_movement_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_stock_opname_item erp_stock_opname_item_opname_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname_item
    ADD CONSTRAINT erp_stock_opname_item_opname_id_fkey FOREIGN KEY (opname_id) REFERENCES public.erp_stock_opname(id);


--
-- Name: erp_stock_opname_item erp_stock_opname_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_stock_opname_item
    ADD CONSTRAINT erp_stock_opname_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_wip_material erp_wip_material_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_wip_material
    ADD CONSTRAINT erp_wip_material_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: erp_wip_material erp_wip_material_wip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_wip_material
    ADD CONSTRAINT erp_wip_material_wip_id_fkey FOREIGN KEY (wip_id) REFERENCES public.erp_work_in_progress(id);


--
-- Name: erp_work_in_progress erp_work_in_progress_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: salon
--

ALTER TABLE ONLY public.erp_work_in_progress
    ADD CONSTRAINT erp_work_in_progress_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.erp_master_product(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: salon
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 08ZMGN67roqf6utLhYR3vbRXzKI1oTapdHk2elNb6xYTyoHaV3NzcPZwh3Pi7fW

