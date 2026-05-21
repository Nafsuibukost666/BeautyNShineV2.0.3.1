// ============================================================
// SHEET CONFIG
// ============================================================

const SHEET_CONFIG = {
  Customers: [
    "customer_id", "customer_name", "phone", "instagram",
    "birthday", "notes", "active", "created_at", "updated_at"
  ],
  Services: [
    "service_id", "service_name", "category", "price",
    "duration_min", "active", "created_at", "updated_at"
  ],
  Staff: [
    "staff_id", "staff_name", "role", "phone",
    "commission_type", "commission_value", "active", "created_at", "updated_at"
  ],
  Products: [
    "product_id", "product_name", "category", "sku", "cost_price",
    "selling_price", "stock_qty", "min_stock", "active", "created_at", "updated_at"
  ],
  Transactions: [
    "transaction_id", "transaction_date", "customer_id", "customer_name",
    "staff_id", "staff_name", "subtotal", "discount", "tax",
    "grand_total", "payment_status", "notes", "created_at"
  ],
  Transaction_Items: [
    "item_id", "transaction_id", "item_type", "item_id_ref",
    "item_name", "qty", "unit_price", "discount", "line_total",
    "staff_id", "staff_name"
  ],
  Payments: [
    "payment_id", "transaction_id", "payment_date", "method",
    "amount", "reference_no", "created_at"
  ],
  Bookings: [
    "booking_id", "booking_date", "booking_time", "customer_id",
    "customer_name", "service_id", "service_name", "staff_id",
    "staff_name", "status", "notes", "created_at", "updated_at"
  ],
  Expenses: [
    "expense_id", "expense_date", "category", "description",
    "amount", "payment_method", "notes", "created_at"
  ],
  Settings: [
    "setting_key", "setting_value", "description"
  ]
};

/**
 * Membuat menu custom di Google Sheets.
 * Menu ini hanya muncul saat file Spreadsheet dibuka.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Salon ERP")
    .addItem("Setup Database", "setupDatabase")
    .addItem("Isi Data Contoh", "seedSampleData")
    .addItem("Cek URL Web App", "showWebAppUrl")
    .addItem("Cek URL Laporan Harian", "showDailyReportUrl")
    .addItem("Cek URL Booking", "showBookingUrl")
    .addToUi();
}

function showBookingUrl() {
  const url = ScriptApp.getService().getUrl();
  if (!url) {
    safeAlert_("Web App belum di-deploy. Klik Deploy > New deployment > Web app.");
    return;
  }
  safeAlert_("URL Booking:\n\n" + url + "?page=booking");
}

/**
 * Router utama Web App.
 * Fungsi:
 * - /exec                membuka POS.html
 * - /exec?page=report   membuka Report.html
 * - /exec?page=booking  membuka Booking.html
 */
function doGet(e) {
  const tabTitles = {
    pos: "POS Salon Eyelash",
    report: "Laporan Harian Salon Eyelash",
    booking: "Booking Salon Eyelash"
  };

  const page = e && e.parameter && e.parameter.page
    ? e.parameter.page
    : "pos";

  return HtmlService
    .createTemplateFromFile("POS")
    .evaluate()
    .setTitle(tabTitles[page] || "Salon Eyelash")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function showWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  if (!url) {
    safeAlert_("Web App belum di-deploy. Klik Deploy > New deployment > Web app.");
    return;
  }
  safeAlert_("URL Web App:\n\n" + url);
}

function showDailyReportUrl() {
  const url = ScriptApp.getService().getUrl();

  if (!url) {
    safeAlert_("Web App belum di-deploy. Klik Deploy > New deployment > Web app.");
    return;
  }
  safeAlert_("URL Laporan Harian:\n\n" + url + "?page=report");
}

// ============================================================
// PERBAIKAN BUG #1: safeAlert_ — satu definisi yang benar
// (Versi lama memanggil safeAlert_() secara rekursif = crash)
// ============================================================

function safeAlert_(message) {
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui && message) {
      ui.alert(message);
    }
  } catch (error) {
    Logger.log(message);
  }
}

// ============================================================
// DATABASE SETUP
// ============================================================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_CONFIG).forEach(function(sheetName) {
    const headers = SHEET_CONFIG[sheetName];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    setupHeader_(sheet, headers);
  });

  safeAlert_("Setup database selesai. Semua sheet utama sudah siap.");
}

function setupHeader_(sheet, headers) {
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0];
  const isEmpty = currentHeaders.every(function(value) { return value === ""; });

  if (isEmpty) {
    headerRange.setValues([headers]);
  }

  headerRange.setFontWeight("bold").setBackground("#f3f3f3");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// ============================================================
// SEED DATA
// ============================================================

function seedSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  seedSettings_(ss);
  seedServices_(ss);
  seedStaff_(ss);
  safeAlert_("Data contoh berhasil ditambahkan.");
}

function seedSettings_(ss) {
  const sheet = ss.getSheetByName("Settings");
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) return;
  sheet.appendRow(["business_name", "Salon Eyelash Anda", "Nama usaha salon"]);
  sheet.appendRow(["currency", "IDR", "Mata uang"]);
  sheet.appendRow(["tax_rate", "0", "Pajak dalam persen"]);
  sheet.appendRow(["next_transaction_number", "1", "Nomor transaksi berikutnya"]);
}

function seedServices_(ss) {
  const sheet = ss.getSheetByName("Services");
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) return;
  const now = new Date();
  sheet.appendRow(["SVC001", "Classic Eyelash", "Eyelash Extension", 250000, 90, true, now, now]);
  sheet.appendRow(["SVC002", "Volume Eyelash", "Eyelash Extension", 350000, 120, true, now, now]);
  sheet.appendRow(["SVC003", "Lash Lift", "Treatment", 200000, 60, true, now, now]);
  sheet.appendRow(["SVC004", "Retouch Eyelash", "Maintenance", 150000, 60, true, now, now]);
}

function seedStaff_(ss) {
  const sheet = ss.getSheetByName("Staff");
  const data = sheet.getDataRange().getValues();
  if (data.length > 1) return;
  const now = new Date();
  sheet.appendRow(["STF001", "Therapist 1", "Therapist", "", "percentage", 10, true, now, now]);
  sheet.appendRow(["STF002", "Therapist 2", "Therapist", "", "percentage", 10, true, now, now]);
}

// ============================================================
// POS FUNCTIONS
// ============================================================

function getPOSInitialData() {
  return {
    services: getActiveServices(),
    staff: getActiveStaff(),
    payment_methods: ["Cash", "QRIS", "Transfer", "Debit", "Credit"]
  };
}

function getActiveServices() {
  return getSheetObjects_("Services")
    .filter(function(row) { return isActive_(row.active); })
    .map(function(row) {
      return {
        service_id: row.service_id,
        service_name: row.service_name,
        category: row.category,
        price: toNumber_(row.price),
        duration_min: toNumber_(row.duration_min)
      };
    });
}

function getActiveStaff() {
  return getSheetObjects_("Staff")
    .filter(function(row) { return isActive_(row.active); })
    .map(function(row) {
      return {
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        role: row.role,
        commission_type: row.commission_type,
        commission_value: toNumber_(row.commission_value)
      };
    });
}

function savePOSTransaction(order) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    validateOrder_(order);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();

    const customer = getOrCreateCustomer_(ss, order.customer || {});
    const staff = findStaffById_(order.staff_id);
    const transactionId = getNextTransactionId_(ss);

    let subtotal = 0;
    const itemRows = [];

    order.items.forEach(function(item) {
      const qty = toNumber_(item.qty || 1);
      const unitPrice = toNumber_(item.unit_price);
      const itemDiscount = toNumber_(item.discount || 0);
      const lineTotal = qty * unitPrice - itemDiscount;

      subtotal += lineTotal;

      const itemStaff = item.staff_id ? findStaffById_(item.staff_id) : staff;

      itemRows.push({
        item_id: makeId_("ITM"),
        transaction_id: transactionId,
        item_type: item.item_type || "service",
        item_id_ref: item.item_id_ref || "",
        item_name: item.item_name,
        qty: qty,
        unit_price: unitPrice,
        discount: itemDiscount,
        line_total: lineTotal,
        staff_id: itemStaff ? itemStaff.staff_id : "",
        staff_name: itemStaff ? itemStaff.staff_name : ""
      });
    });

    const discount = toNumber_(order.discount || 0);
    const tax = toNumber_(order.tax || 0);
    const grandTotal = subtotal - discount + tax;

    const payment = order.payment || {};
    const paymentAmount = toNumber_(payment.amount || 0);

    let paymentStatus = "unpaid";
    if (paymentAmount >= grandTotal) {
      paymentStatus = "paid";
    } else if (paymentAmount > 0) {
      paymentStatus = "partial";
    }

    appendObject_("Transactions", {
      transaction_id: transactionId,
      transaction_date: now,
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      staff_id: staff ? staff.staff_id : "",
      staff_name: staff ? staff.staff_name : "",
      subtotal: subtotal,
      discount: discount,
      tax: tax,
      grand_total: grandTotal,
      payment_status: paymentStatus,
      notes: order.notes || "",
      created_at: now
    });

    itemRows.forEach(function(row) { appendObject_("Transaction_Items", row); });

    if (paymentAmount > 0) {
      appendObject_("Payments", {
        payment_id: makeId_("PAY"),
        transaction_id: transactionId,
        payment_date: now,
        method: payment.method || "Cash",
        amount: paymentAmount,
        reference_no: payment.reference_no || "",
        created_at: now
      });
    }

    return {
      success: true,
      message: "Transaksi berhasil disimpan",
      transaction_id: transactionId,
      grand_total: grandTotal,
      payment_status: paymentStatus
    };

  } finally {
    lock.releaseLock();
  }
}

function validateOrder_(order) {
  if (!order) throw new Error("Data transaksi kosong.");
  if (!order.items || order.items.length === 0) throw new Error("Transaksi harus memiliki minimal 1 item.");
  order.items.forEach(function(item) {
    if (!item.item_name) throw new Error("Nama item tidak boleh kosong.");
    if (toNumber_(item.unit_price) <= 0) throw new Error("Harga item harus lebih dari 0.");
  });
}

function getOrCreateCustomer_(ss, customerInput) {
  const name = customerInput.customer_name || customerInput.name || "Walk-in Customer";
  const phone = customerInput.phone || "";

  if (!phone && name === "Walk-in Customer") {
    return { customer_id: "WALKIN", customer_name: "Walk-in Customer" };
  }

  const customers = getSheetObjects_("Customers");
  const existing = customers.find(function(row) {
    return String(row.phone || "") === String(phone || "") && phone !== "";
  });

  if (existing) {
    return { customer_id: existing.customer_id, customer_name: existing.customer_name };
  }

  const now = new Date();
  const newCustomer = {
    customer_id: makeId_("CUS"),
    customer_name: name,
    phone: phone,
    instagram: customerInput.instagram || "",
    birthday: customerInput.birthday || "",
    notes: customerInput.notes || "",
    active: true,
    created_at: now,
    updated_at: now
  };

  appendObject_("Customers", newCustomer);
  return { customer_id: newCustomer.customer_id, customer_name: newCustomer.customer_name };
}

function findStaffById_(staffId) {
  if (!staffId) return null;
  const staffRows = getSheetObjects_("Staff");
  const staff = staffRows.find(function(row) { return String(row.staff_id) === String(staffId); });
  if (!staff) return null;
  return { staff_id: staff.staff_id, staff_name: staff.staff_name };
}

function getNextTransactionId_(ss) {
  const sheet = ss.getSheetByName("Settings");
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let nextNumber = 1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === "next_transaction_number") {
      rowIndex = i + 1;
      nextNumber = toNumber_(values[i][1]) || 1;
      break;
    }
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  const transactionId = "TRX-" + today + "-" + String(nextNumber).padStart(4, "0");

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 2).setValue(nextNumber + 1);
  } else {
    sheet.appendRow(["next_transaction_number", nextNumber + 1, "Nomor transaksi berikutnya"]);
  }

  return transactionId;
}

// ============================================================
// RECEIPT
// ============================================================

function getTransactionReceipt(transactionId) {
  if (!transactionId) throw new Error("Transaction ID kosong.");

  const settings = getSettingsMap_();
  const transactions = getSheetObjects_("Transactions");
  const transaction = transactions.find(function(row) {
    return String(row.transaction_id) === String(transactionId);
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan: " + transactionId);

  const items = getSheetObjects_("Transaction_Items")
    .filter(function(row) { return String(row.transaction_id) === String(transactionId); })
    .map(function(row) {
      return {
        item_name: row.item_name,
        qty: toNumber_(row.qty),
        unit_price: toNumber_(row.unit_price),
        discount: toNumber_(row.discount),
        line_total: toNumber_(row.line_total),
        staff_name: row.staff_name
      };
    });

  const payments = getSheetObjects_("Payments")
    .filter(function(row) { return String(row.transaction_id) === String(transactionId); })
    .map(function(row) {
      return {
        method: row.method,
        amount: toNumber_(row.amount),
        reference_no: row.reference_no,
        payment_date: formatDateTime_(row.payment_date)
      };
    });

  return {
    business_name: settings.business_name || "Salon Eyelash",
    transaction_id: transaction.transaction_id,
    transaction_date: formatDateTime_(transaction.transaction_date),
    customer_name: transaction.customer_name || "Walk-in Customer",
    staff_name: transaction.staff_name || "-",
    subtotal: toNumber_(transaction.subtotal),
    discount: toNumber_(transaction.discount),
    tax: toNumber_(transaction.tax),
    grand_total: toNumber_(transaction.grand_total),
    payment_status: transaction.payment_status,
    notes: transaction.notes || "",
    items: items,
    payments: payments
  };
}

// ============================================================
// PING — digunakan Report.html untuk cek koneksi
// ============================================================

function pingReportV2() {
  return "Koneksi Report.html ke Code.gs berhasil - V2";
}

// ============================================================
// PERBAIKAN BUG #2 & #3:
// getDailySalesReportV3 — satu definisi saja (duplikat dihapus)
// Ini adalah fungsi utama yang dipanggil Report.html
// ============================================================

function getDailySalesReportV3(dateString) {
  try {
    const targetDate = dateString || getTodayDateStringV3_();

    const transactions = getTransactionsByDateV3_(targetDate);

    const transactionIdMap = {};
    transactions.forEach(function(row) {
      transactionIdMap[String(row.transaction_id)] = true;
    });

    const items = getRowsByTransactionIdsV3_("Transaction_Items", "transaction_id", transactionIdMap);
    const payments = getRowsByTransactionIdsV3_("Payments", "transaction_id", transactionIdMap);

    let subtotal = 0, discount = 0, tax = 0, grandTotal = 0, totalPaid = 0;

    transactions.forEach(function(row) {
      subtotal += numberV3_(row.subtotal);
      discount += numberV3_(row.discount);
      tax += numberV3_(row.tax);
      grandTotal += numberV3_(row.grand_total);
    });

    payments.forEach(function(row) {
      totalPaid += numberV3_(row.amount);
    });

    return {
      success: true,
      date: targetDate,
      summary: {
        transaction_count: transactions.length,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        grand_total: grandTotal,
        total_paid: totalPaid,
        unpaid_amount: grandTotal - totalPaid
      },
      payment_breakdown: buildPaymentBreakdownV3_(payments),
      therapist_breakdown: buildTherapistBreakdownV3_(items),
      commission_breakdown: buildCommissionBreakdownV3_(items),
      service_breakdown: buildServiceBreakdownV3_(items),
      transactions: buildDailyTransactionListV3_(transactions, payments)
    };

  } catch (error) {
    return {
      success: false,
      error_message: error.message,
      date: dateString || "",
      summary: { transaction_count: 0, subtotal: 0, discount: 0, tax: 0, grand_total: 0, total_paid: 0, unpaid_amount: 0 },
      payment_breakdown: [],
      therapist_breakdown: [],
      commission_breakdown: [],
      service_breakdown: [],
      transactions: []
    };
  }
}

function getTransactionsByDateV3_(targetDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");

  if (!sheet) throw new Error("Sheet Transactions tidak ditemukan.");

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });

  const dateIndex = headers.indexOf("transaction_date");
  if (dateIndex === -1) throw new Error("Kolom transaction_date tidak ditemukan di sheet Transactions.");

  const dateColumn = dateIndex + 1;
  const dateValues = sheet.getRange(2, dateColumn, lastRow - 1, 1).getValues();

  const matchedRows = [];
  dateValues.forEach(function(row, index) {
    if (dateKeyV3_(row[0]) === targetDate) {
      matchedRows.push(index + 2);
    }
  });

  return matchedRows.map(function(rowNumber) {
    const rowValues = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
    return rowToObjectV3_(headers, rowValues);
  });
}

function getRowsByTransactionIdsV3_(sheetName, transactionIdHeader, transactionIdMap) {
  const ids = Object.keys(transactionIdMap);
  if (ids.length === 0) return [];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });

  const transactionIndex = headers.indexOf(transactionIdHeader);
  if (transactionIndex === -1) throw new Error("Kolom " + transactionIdHeader + " tidak ditemukan di sheet " + sheetName);

  const transactionColumn = transactionIndex + 1;
  const idValues = sheet.getRange(2, transactionColumn, lastRow - 1, 1).getValues();

  const matchedRows = [];
  idValues.forEach(function(row, index) {
    if (transactionIdMap[String(row[0] || "")]) {
      matchedRows.push(index + 2);
    }
  });

  return matchedRows.map(function(rowNumber) {
    const rowValues = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
    return rowToObjectV3_(headers, rowValues);
  });
}

function rowToObjectV3_(headers, rowValues) {
  const obj = {};
  headers.forEach(function(header, index) {
    if (header) obj[header] = rowValues[index];
  });
  return obj;
}

function buildPaymentBreakdownV3_(payments) {
  const map = {};
  payments.forEach(function(row) {
    const method = row.method || "Tidak diketahui";
    if (!map[method]) map[method] = { method: method, count: 0, amount: 0 };
    map[method].count += 1;
    map[method].amount += numberV3_(row.amount);
  });
  return Object.keys(map).map(function(key) { return map[key]; });
}

function buildTherapistBreakdownV3_(items) {
  const map = {};
  items.forEach(function(row) {
    const staffName = row.staff_name || "Tanpa Therapist";
    const transactionId = String(row.transaction_id || "");
    if (!map[staffName]) map[staffName] = { staff_name: staffName, transaction_ids: {}, service_qty: 0, revenue: 0 };
    map[staffName].transaction_ids[transactionId] = true;
    map[staffName].service_qty += numberV3_(row.qty);
    map[staffName].revenue += numberV3_(row.line_total);
  });
  return Object.keys(map).map(function(key) {
    const row = map[key];
    return {
      staff_name: row.staff_name,
      transaction_count: Object.keys(row.transaction_ids).length,
      service_qty: row.service_qty,
      revenue: row.revenue
    };
  });
}

function buildServiceBreakdownV3_(items) {
  const map = {};
  items.forEach(function(row) {
    const itemName = row.item_name || "Tanpa Nama";
    if (!map[itemName]) map[itemName] = { item_name: itemName, qty: 0, revenue: 0 };
    map[itemName].qty += numberV3_(row.qty);
    map[itemName].revenue += numberV3_(row.line_total);
  });
  return Object.keys(map).map(function(key) { return map[key]; });
}

function buildCommissionBreakdownV3_(items) {
  const staffMap = getStaffCommissionMapV3_();
  const map = {};

  items.forEach(function(row) {
    const staffId = String(row.staff_id || "");
    const staffName = row.staff_name || "Tanpa Therapist";
    const qty = numberV3_(row.qty);
    const revenue = numberV3_(row.line_total);

    const rule = staffMap[staffId] || { commission_type: "percentage", commission_value: 0 };
    const commissionType = String(rule.commission_type || "percentage").toLowerCase();
    const commissionValue = numberV3_(rule.commission_value);

    let commissionAmount = 0;
    if (commissionType === "percentage" || commissionType === "percent" || commissionType === "persen") {
      commissionAmount = revenue * commissionValue / 100;
    } else {
      commissionAmount = commissionValue * qty;
    }

    const key = staffId || staffName;
    if (!map[key]) {
      map[key] = { staff_id: staffId, staff_name: staffName, commission_type: commissionType, commission_value: commissionValue, service_qty: 0, revenue: 0, commission_amount: 0 };
    }
    map[key].service_qty += qty;
    map[key].revenue += revenue;
    map[key].commission_amount += commissionAmount;
  });

  return Object.keys(map).map(function(key) { return map[key]; });
}

function getStaffCommissionMapV3_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Staff");
  if (!sheet) return {};

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return {};

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const map = {};

  values.forEach(function(rowValues) {
    const row = rowToObjectV3_(headers, rowValues);
    const staffId = String(row.staff_id || "");
    if (staffId) {
      map[staffId] = {
        commission_type: row.commission_type || "percentage",
        commission_value: numberV3_(row.commission_value)
      };
    }
  });

  return map;
}

function buildDailyTransactionListV3_(transactions, payments) {
  const paymentMap = {};
  payments.forEach(function(row) {
    const transactionId = String(row.transaction_id || "");
    if (!paymentMap[transactionId]) paymentMap[transactionId] = { amount: 0, methods: [] };
    paymentMap[transactionId].amount += numberV3_(row.amount);
    if (row.method) paymentMap[transactionId].methods.push(row.method);
  });

  return transactions.map(function(row) {
    const transactionId = String(row.transaction_id || "");
    const payment = paymentMap[transactionId] || { amount: 0, methods: [] };
    return {
      transaction_id: transactionId,
      transaction_date: dateTimeTextV3_(row.transaction_date),
      customer_name: row.customer_name || "Walk-in Customer",
      staff_name: row.staff_name || "-",
      grand_total: numberV3_(row.grand_total),
      paid_amount: payment.amount,
      payment_methods: payment.methods.join(", "),
      payment_status: row.payment_status || "-"
    };
  });
}

// ============================================================
// V3 UTILITY FUNCTIONS
// ============================================================

function numberV3_(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}

function getTodayDateStringV3_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function dateKeyV3_(value) {
  const date = parseDateV3_(value);
  if (!date) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function dateTimeTextV3_(value) {
  const date = parseDateV3_(value);
  if (!date) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}

function parseDateV3_(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const text = String(value).trim();

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ============================================================
// V2 REPORT (dipertahankan untuk kompatibilitas)
// ============================================================

function getDailySalesReportV2(dateString) {
  try {
    const targetDate = dateString || getTodayDateStringV2_();
    const transactionsAll = getSheetRowsV2_("Transactions");
    const itemsAll = getSheetRowsV2_("Transaction_Items");
    const paymentsAll = getSheetRowsV2_("Payments");

    const transactions = transactionsAll.filter(function(row) {
      return dateKeyV2_(row.transaction_date) === targetDate;
    });

    const transactionIdMap = {};
    transactions.forEach(function(row) { transactionIdMap[String(row.transaction_id)] = true; });

    const items = itemsAll.filter(function(row) { return transactionIdMap[String(row.transaction_id)] === true; });
    const payments = paymentsAll.filter(function(row) { return transactionIdMap[String(row.transaction_id)] === true; });

    let subtotal = 0, discount = 0, tax = 0, grandTotal = 0, totalPaid = 0;
    transactions.forEach(function(row) {
      subtotal += numberV2_(row.subtotal);
      discount += numberV2_(row.discount);
      tax += numberV2_(row.tax);
      grandTotal += numberV2_(row.grand_total);
    });
    payments.forEach(function(row) { totalPaid += numberV2_(row.amount); });

    return {
      success: true, date: targetDate,
      summary: { transaction_count: transactions.length, subtotal, discount, tax, grand_total: grandTotal, total_paid: totalPaid, unpaid_amount: grandTotal - totalPaid },
      payment_breakdown: buildPaymentBreakdownV2_(payments),
      therapist_breakdown: buildTherapistBreakdownV2_(items),
      commission_breakdown: buildCommissionBreakdownV2_(items),
      service_breakdown: buildServiceBreakdownV2_(items),
      transactions: buildDailyTransactionListV2_(transactions, payments)
    };
  } catch (error) {
    return {
      success: false, error_message: error.message, date: dateString || "",
      summary: { transaction_count: 0, subtotal: 0, discount: 0, tax: 0, grand_total: 0, total_paid: 0, unpaid_amount: 0 },
      payment_breakdown: [], therapist_breakdown: [], commission_breakdown: [], service_breakdown: [], transactions: []
    };
  }
}

function getSheetRowsV2_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) return [];

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(h) { return String(h || "").trim(); });
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()
    .filter(function(row) { return row.some(function(cell) { return cell !== ""; }); })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) { if (header) obj[header] = row[index]; });
      return obj;
    });
}

function buildPaymentBreakdownV2_(payments) {
  const map = {};
  payments.forEach(function(row) {
    const method = row.method || "Tidak diketahui";
    if (!map[method]) map[method] = { method, count: 0, amount: 0 };
    map[method].count += 1;
    map[method].amount += numberV2_(row.amount);
  });
  return Object.keys(map).map(function(key) { return map[key]; });
}

function buildTherapistBreakdownV2_(items) {
  const map = {};
  items.forEach(function(row) {
    const staffName = row.staff_name || "Tanpa Therapist";
    const transactionId = String(row.transaction_id || "");
    if (!map[staffName]) map[staffName] = { staff_name: staffName, transaction_ids: {}, service_qty: 0, revenue: 0 };
    map[staffName].transaction_ids[transactionId] = true;
    map[staffName].service_qty += numberV2_(row.qty);
    map[staffName].revenue += numberV2_(row.line_total);
  });
  return Object.keys(map).map(function(key) {
    const row = map[key];
    return { staff_name: row.staff_name, transaction_count: Object.keys(row.transaction_ids).length, service_qty: row.service_qty, revenue: row.revenue };
  });
}

function buildServiceBreakdownV2_(items) {
  const map = {};
  items.forEach(function(row) {
    const itemName = row.item_name || "Tanpa Nama";
    if (!map[itemName]) map[itemName] = { item_name: itemName, qty: 0, revenue: 0 };
    map[itemName].qty += numberV2_(row.qty);
    map[itemName].revenue += numberV2_(row.line_total);
  });
  return Object.keys(map).map(function(key) { return map[key]; });
}

function buildCommissionBreakdownV2_(items) {
  const staffMap = getStaffCommissionMapV2_();
  const map = {};
  items.forEach(function(row) {
    const staffId = String(row.staff_id || "");
    const staffName = row.staff_name || "Tanpa Therapist";
    const qty = numberV2_(row.qty);
    const revenue = numberV2_(row.line_total);
    const rule = staffMap[staffId] || { commission_type: "percentage", commission_value: 0 };
    const commissionType = String(rule.commission_type || "percentage").toLowerCase();
    const commissionValue = numberV2_(rule.commission_value);
    let commissionAmount = (commissionType === "percentage" || commissionType === "percent" || commissionType === "persen")
      ? revenue * commissionValue / 100
      : commissionValue * qty;
    const key = staffId || staffName;
    if (!map[key]) map[key] = { staff_id: staffId, staff_name: staffName, commission_type: commissionType, commission_value: commissionValue, service_qty: 0, revenue: 0, commission_amount: 0 };
    map[key].service_qty += qty;
    map[key].revenue += revenue;
    map[key].commission_amount += commissionAmount;
  });
  return Object.keys(map).map(function(key) { return map[key]; });
}

function getStaffCommissionMapV2_() {
  const rows = getSheetRowsV2_("Staff");
  const map = {};
  rows.forEach(function(row) {
    const staffId = String(row.staff_id || "");
    if (staffId) map[staffId] = { commission_type: row.commission_type || "percentage", commission_value: numberV2_(row.commission_value) };
  });
  return map;
}

function buildDailyTransactionListV2_(transactions, payments) {
  const paymentMap = {};
  payments.forEach(function(row) {
    const transactionId = String(row.transaction_id || "");
    if (!paymentMap[transactionId]) paymentMap[transactionId] = { amount: 0, methods: [] };
    paymentMap[transactionId].amount += numberV2_(row.amount);
    if (row.method) paymentMap[transactionId].methods.push(row.method);
  });
  return transactions.map(function(row) {
    const transactionId = String(row.transaction_id || "");
    const payment = paymentMap[transactionId] || { amount: 0, methods: [] };
    return {
      transaction_id: transactionId,
      transaction_date: dateTimeTextV2_(row.transaction_date),
      customer_name: row.customer_name || "Walk-in Customer",
      staff_name: row.staff_name || "-",
      grand_total: numberV2_(row.grand_total),
      paid_amount: payment.amount,
      payment_methods: payment.methods.join(", "),
      payment_status: row.payment_status || "-"
    };
  });
}

function numberV2_(value) { const n = Number(value); return isNaN(n) ? 0 : n; }
function getTodayDateStringV2_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }
function dateKeyV2_(value) { const d = parseDateV2_(value); return d ? Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd") : ""; }
function dateTimeTextV2_(value) { const d = parseDateV2_(value); return d ? Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm") : ""; }

function parseDateV2_(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ============================================================
// SHARED UTILITIES
// ============================================================

function getSheetObjects_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(header, index) { obj[header] = row[index]; });
    return obj;
  });
}

function appendObject_(sheetName, obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  let lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) {
    const headers = SHEET_CONFIG[sheetName];
    if (!headers) throw new Error("Konfigurasi header tidak ditemukan untuk sheet: " + sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
    lastColumn = headers.length;
  }

  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const row = headers.map(function(header) { return obj[header] !== undefined ? obj[header] : ""; });
  sheet.appendRow(row);
}

function makeId_(prefix) {
  return prefix + "-" + Utilities.getUuid().split("-")[0].toUpperCase();
}

function toNumber_(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}

function isActive_(value) {
  const text = String(value).trim().toUpperCase();
  return value === true || text === "TRUE" || text === "YA" || text === "YES" || text === "AKTIF" || text === "ACTIVE" || text === "1";
}

function getSettingsMap_() {
  const rows = getSheetObjects_("Settings");
  const map = {};
  rows.forEach(function(row) { map[row.setting_key] = row.setting_value; });
  return map;
}

function formatDateTime_(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}

function getTodayDateString_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

// ============================================================
// TEST FUNCTIONS
// ============================================================

function testSavePOSTransaction() {
  const result = savePOSTransaction({
    customer: { customer_name: "Customer Test", phone: "08123456789", instagram: "@customertest" },
    staff_id: "STF001",
    items: [{ item_type: "service", item_id_ref: "SVC001", item_name: "Classic Eyelash", qty: 1, unit_price: 250000, discount: 0, staff_id: "STF001" }],
    discount: 0, tax: 0,
    payment: { method: "Cash", amount: 250000, reference_no: "" },
    notes: "Transaksi test dari Apps Script"
  });
  Logger.log(result);
}

function testGetActiveStaff() {
  Logger.log(JSON.stringify(getActiveStaff(), null, 2));
}

function testDailySalesReportV2() {
  Logger.log(JSON.stringify(getDailySalesReportV2("2026-05-16"), null, 2));
}

function testDailySalesReportV3() {
  Logger.log(JSON.stringify(getDailySalesReportV3("2026-05-16"), null, 2));
}

function testDailySalesReport() {
  Logger.log(JSON.stringify(getDailySalesReportV3(getTodayDateString_()), null, 2));
}

function testCommissionReport() {
  const report = getDailySalesReportV3(getTodayDateString_());
  Logger.log(JSON.stringify(report.commission_breakdown, null, 2));
}

function testPingReportV2() {
  Logger.log(pingReportV2());
}

function checkReportSheetSizes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ["Transactions", "Transaction_Items", "Payments", "Staff"].forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) { Logger.log(name + " tidak ditemukan"); return; }
    Logger.log(name + " | lastRow: " + sheet.getLastRow() + " | lastColumn: " + sheet.getLastColumn());
  });
}

function checkReportSheetSizesLite() {
  checkReportSheetSizes();
}

// ============================================================
// Booking Config
// ============================================================

function getBookingInitialData() {
  return {
    services: getActiveServices(),
    staff: getActiveStaff(),
    statuses: ["booked", "done", "cancelled", "no_show"]
  };
}

function saveBooking(booking) {
  validateBooking_(booking);

  const now = new Date();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const customer = getOrCreateCustomer_(ss, {
    customer_name: booking.customer_name,
    phone: booking.phone || "",
    instagram: booking.instagram || ""
  });

  const service = findServiceById_(booking.service_id);
  const staff = findStaffById_(booking.staff_id);

  const newBooking = {
    booking_id: makeId_("BKG"),
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    customer_id: customer.customer_id,
    customer_name: customer.customer_name,
    service_id: service ? service.service_id : booking.service_id,
    service_name: service ? service.service_name : "",
    staff_id: staff ? staff.staff_id : booking.staff_id,
    staff_name: staff ? staff.staff_name : "",
    status: booking.status || "booked",
    notes: booking.notes || "",
    created_at: now,
    updated_at: now
  };

  appendObject_("Bookings", newBooking);

  return {
    success: true,
    message: "Booking berhasil disimpan",
    booking_id: newBooking.booking_id
  };
}

function getBookingsByDate(dateString) {
  if (!dateString) {
    throw new Error("Tanggal booking kosong.");
  }

  const bookings = getSheetObjects_("Bookings")
    .filter(function(row) {
      return normalizeBookingDate_(row.booking_date) === dateString;
    })
    .map(function(row) {
      return {
        booking_id: row.booking_id,
        booking_date: normalizeBookingDate_(row.booking_date),
        booking_time: row.booking_time,
        customer_name: row.customer_name,
        service_name: row.service_name,
        staff_name: row.staff_name,
        status: row.status,
        notes: row.notes
      };
    });
function normalizeBookingDate_(value) {
  if (!value) return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  const text = String(value).trim();

  // Format yyyy-MM-dd
  const match1 = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match1) return text.substring(0, 10);

  // ✅ TAMBAHAN: Format dd/MM/yyyy (umum di Google Sheets)
  const match2 = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match2) {
    const d = match2[1].padStart(2, "0");
    const m = match2[2].padStart(2, "0");
    const y = match2[3];
    return y + "-" + m + "-" + d;
  }

  const fallback = new Date(value);
  if (!isNaN(fallback.getTime())) {
    return Utilities.formatDate(fallback, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return text;
}
  bookings.sort(function(a, b) {
    return String(a.booking_time).localeCompare(String(b.booking_time));
  });

  return bookings;
}

function updateBookingStatus(bookingId, newStatus) {
  if (!bookingId) {
    throw new Error("Booking ID kosong.");
  }

  if (!newStatus) {
    throw new Error("Status baru kosong.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Bookings");

  if (!sheet) {
    throw new Error("Sheet Bookings tidak ditemukan.");
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    throw new Error("Belum ada data booking.");
  }

  const headers = values[0];
  const bookingIdIndex = headers.indexOf("booking_id");
  const statusIndex = headers.indexOf("status");
  const updatedAtIndex = headers.indexOf("updated_at");

  if (bookingIdIndex === -1 || statusIndex === -1) {
    throw new Error("Header booking_id atau status tidak ditemukan.");
  }

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][bookingIdIndex]) === String(bookingId)) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);

      if (updatedAtIndex > -1) {
        sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date());
      }

      return {
        success: true,
        message: "Status booking berhasil diubah"
      };
    }
  }

  throw new Error("Booking tidak ditemukan: " + bookingId);
}

function findServiceById_(serviceId) {
  if (!serviceId) return null;

  const services = getSheetObjects_("Services");

  const service = services.find(function(row) {
    return String(row.service_id) === String(serviceId);
  });

  if (!service) return null;

  return {
    service_id: service.service_id,
    service_name: service.service_name,
    price: toNumber_(service.price)
  };
}

function validateBooking_(booking) {
  if (!booking) {
    throw new Error("Data booking kosong.");
  }

  if (!booking.booking_date) {
    throw new Error("Tanggal booking wajib diisi.");
  }

  if (!booking.booking_time) {
    throw new Error("Jam booking wajib diisi.");
  }

  if (!booking.customer_name) {
    throw new Error("Nama customer wajib diisi.");
  }

  if (!booking.service_id) {
    throw new Error("Layanan wajib dipilih.");
  }

  if (!booking.staff_id) {
    throw new Error("Therapist wajib dipilih.");
  }
}

function normalizeBookingDate_(value) {
  if (!value) return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const text = String(value).trim();

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return text.substring(0, 10);
  }

  const fallback = new Date(value);

  if (!isNaN(fallback.getTime())) {
    return Utilities.formatDate(
      fallback,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  return text;
}

function testSaveBooking() {
  const result = saveBooking({
    booking_date: new Date(booking.booking_date + "T00:00:00"),
    booking_time: "13:00",
    customer_name: "Customer Booking Test",
    phone: "081111111111",
    instagram: "@bookingtest",
    service_id: "SVC001",
    staff_id: "STF001",
    status: "booked",
    notes: "Test booking dari Apps Script"
  });

  Logger.log(JSON.stringify(result, null, 2));
}

function testBookingInitialData() {
  const data = getBookingInitialData();

  Logger.log("Jumlah services: " + data.services.length);
  Logger.log("Jumlah staff: " + data.staff.length);
  Logger.log(JSON.stringify(data, null, 2));
}

/**
 * Menampilkan URL halaman Booking dari menu Google Sheets.
 */
function showBookingUrl() {
  const url = ScriptApp.getService().getUrl();

  if (!url) {
    safeAlert_("Web App belum di-deploy. Klik Deploy > New deployment > Web app.");
    return;
  }

  safeAlert_("URL Booking:\n\n" + url + "?page=booking");
}

/**
 * Alert aman.
 * Jika dipanggil dari Google Sheets, akan tampil alert.
 * Jika dipanggil dari Web App, tidak error dan hanya masuk Logger.
 */
function safeAlert_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    Logger.log(message);
  }
}

/**
 * Function utama yang dipanggil Booking.html untuk mengisi dropdown.
 * Mengambil data aktif dari sheet Services dan Staff.
 */
function getBookingInitialDataV6() {
  return {
    services: getBookingServicesV6_(),
    staff: getBookingStaffV6_(),
    statuses: ["booked", "done", "cancelled", "no_show"]
  };
}

/**
 * Mengambil daftar layanan dari sheet Services.
 * Data dipakai untuk dropdown Layanan di Booking.html.
 */
function getBookingServicesV6_() {
  const rows = getRowsV6_("Services", 1000);

  return rows
    .filter(function(row) {
      return isActiveV6_(row.active);
    })
    .map(function(row) {
      return {
        service_id: String(row.service_id || ""),
        service_name: String(row.service_name || ""),
        category: String(row.category || ""),
        price: numberV6_(row.price),
        duration_min: numberV6_(row.duration_min)
      };
    })
    .filter(function(row) {
      return row.service_id && row.service_name;
    });
}

/**
 * Mengambil daftar therapist dari sheet Staff.
 * Data dipakai untuk dropdown Therapist di Booking.html.
 */
function getBookingStaffV6_() {
  const rows = getRowsV6_("Staff", 1000);

  return rows
    .filter(function(row) {
      return isActiveV6_(row.active);
    })
    .map(function(row) {
      return {
        staff_id: String(row.staff_id || ""),
        staff_name: String(row.staff_name || ""),
        role: String(row.role || ""),
        commission_type: String(row.commission_type || "percentage"),
        commission_value: numberV6_(row.commission_value)
      };
    })
    .filter(function(row) {
      return row.staff_id && row.staff_name;
    });
}

/**
 * Membaca data sheet menjadi array object.
 * Contoh hasil:
 * [
 *   { service_id: "SVC001", service_name: "Classic Lash", price: 100000 }
 * ]
 *
 * maxRows dipakai agar script tidak membaca ribuan baris kosong.
 */
function getRowsV6_(sheetName, maxRows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Sheet tidak ditemukan: " + sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  const columnCount = Math.min(lastColumn, 50);

  const headers = sheet
    .getRange(1, 1, 1, columnCount)
    .getValues()[0]
    .map(function(header) {
      return String(header || "").trim();
    });

  const rowCount = Math.min(lastRow - 1, maxRows || 1000);

  const values = sheet
    .getRange(2, 1, rowCount, columnCount)
    .getValues();

  return values
    .filter(function(row) {
      return row.some(function(cell) {
        return cell !== "";
      });
    })
    .map(function(row) {
      const obj = {};

      headers.forEach(function(header, index) {
        if (header) {
          obj[header] = row[index];
        }
      });

      return obj;
    });
}

/**
 * Mengecek apakah baris data aktif.
 * TRUE, YA, YES, AKTIF, ACTIVE, dan 1 dianggap aktif.
 * Jika kolom active kosong, data tetap dianggap aktif agar dropdown tidak kosong.
 */
function isActiveV6_(value) {
  if (value === "" || value === undefined || value === null) {
    return true;
  }

  const text = String(value).trim().toUpperCase();

  return (
    value === true ||
    text === "TRUE" ||
    text === "YA" ||
    text === "YES" ||
    text === "AKTIF" ||
    text === "ACTIVE" ||
    text === "1"
  );
}

/**
 * Mengubah nilai menjadi angka.
 * Aman untuk harga seperti 100000 atau "100.000".
 */
function numberV6_(value) {
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }

  const text = String(value || "")
    .replace(/Rp/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

  const number = Number(text);

  return isNaN(number) ? 0 : number;
}

/**
 * Menyimpan booking baru.
 * Function ini tetap bernama saveBooking karena Booking.html memanggil saveBooking(booking).
 */
function saveBooking(booking) {
  validateBookingV6_(booking);

  const now = new Date();

  const customer = getOrCreateCustomerV6_({
    customer_name: booking.customer_name,
    phone: booking.phone || "",
    instagram: booking.instagram || ""
  });

  const service = findServiceByIdV6_(booking.service_id);
  const staff = findStaffByIdV6_(booking.staff_id);

  const newBooking = {
    booking_id: makeIdV6_("BKG"),
    booking_date: normalizeDateV6_(booking.booking_date),
    booking_time: normalizeTimeV6_(booking.booking_time),
    customer_id: customer.customer_id,
    customer_name: customer.customer_name,
    service_id: service ? service.service_id : booking.service_id,
    service_name: service ? service.service_name : "",
    staff_id: staff ? staff.staff_id : booking.staff_id,
    staff_name: staff ? staff.staff_name : "",
    status: booking.status || "booked",
    notes: booking.notes || "",
    created_at: now,
    updated_at: now
  };

  appendObjectV6_("Bookings", newBooking);

  return {
    success: true,
    message: "Booking berhasil disimpan",
    booking_id: newBooking.booking_id
  };
}

/**
 * Validasi data booking sebelum disimpan.
 * Mencegah data kosong masuk ke sheet Bookings.
 */
function validateBookingV6_(booking) {
  if (!booking) {
    throw new Error("Data booking kosong.");
  }

  if (!booking.booking_date) {
    throw new Error("Tanggal booking wajib diisi.");
  }

  if (!booking.booking_time) {
    throw new Error("Jam booking wajib diisi.");
  }

  if (!booking.customer_name) {
    throw new Error("Nama customer wajib diisi.");
  }

  if (!booking.service_id) {
    throw new Error("Layanan wajib dipilih.");
  }

  if (!booking.staff_id) {
    throw new Error("Therapist wajib dipilih.");
  }
}

/**
 * Mencari atau membuat customer.
 * Jika nomor HP sudah ada di Customers, customer lama dipakai.
 * Jika belum ada, customer baru dibuat.
 */
function getOrCreateCustomerV6_(customerInput) {
  const name = customerInput.customer_name || "Walk-in Customer";
  const phone = customerInput.phone || "";

  if (!phone && name === "Walk-in Customer") {
    return {
      customer_id: "WALKIN",
      customer_name: "Walk-in Customer"
    };
  }

  const rows = getRowsV6_("Customers", 2000);

  const existing = rows.find(function(row) {
    return phone && String(row.phone || "") === String(phone);
  });

  if (existing) {
    return {
      customer_id: existing.customer_id,
      customer_name: existing.customer_name
    };
  }

  const now = new Date();

  const newCustomer = {
    customer_id: makeIdV6_("CUS"),
    customer_name: name,
    phone: phone,
    instagram: customerInput.instagram || "",
    birthday: "",
    notes: "",
    active: true,
    created_at: now,
    updated_at: now
  };

  appendObjectV6_("Customers", newCustomer);

  return {
    customer_id: newCustomer.customer_id,
    customer_name: newCustomer.customer_name
  };
}

/**
 * Mencari layanan berdasarkan service_id.
 */
function findServiceByIdV6_(serviceId) {
  const rows = getRowsV6_("Services", 1000);

  const service = rows.find(function(row) {
    return String(row.service_id || "") === String(serviceId || "");
  });

  if (!service) {
    return null;
  }

  return {
    service_id: service.service_id,
    service_name: service.service_name,
    price: numberV6_(service.price)
  };
}

/**
 * Mencari therapist berdasarkan staff_id.
 */
function findStaffByIdV6_(staffId) {
  const rows = getRowsV6_("Staff", 1000);

  const staff = rows.find(function(row) {
    return String(row.staff_id || "") === String(staffId || "");
  });

  if (!staff) {
    return null;
  }

  return {
    staff_id: staff.staff_id,
    staff_name: staff.staff_name
  };
}

/**
 * Menambahkan object ke sheet sesuai header.
 * Contoh:
 * appendObjectV6_("Bookings", { booking_id: "BKG-123", status: "booked" })
 */
function appendObjectV6_(sheetName, obj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  let lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    const headers = SHEET_CONFIG && SHEET_CONFIG[sheetName];

    if (!headers) {
      throw new Error("Konfigurasi header tidak ditemukan untuk sheet: " + sheetName);
    }

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    lastColumn = headers.length;
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(header) {
      return String(header || "").trim();
    });

  const row = headers.map(function(header) {
    return obj[header] !== undefined ? obj[header] : "";
  });

  sheet.appendRow(row);
}

/**
 * Mengambil daftar booking berdasarkan tanggal.
 * Dipakai oleh tombol Muat Booking di Booking.html.
 */
function getBookingsByDateV6(dateString) {
  if (!dateString) {
    throw new Error("Tanggal booking kosong.");
  }

  const rows = getRowsV6_("Bookings", 2000);

  const bookings = rows
    .filter(function(row) {
      return normalizeDateV6_(row.booking_date) === normalizeDateV6_(dateString);
    })
    .map(function(row) {
      return {
        booking_id: row.booking_id || "",
        booking_date: normalizeDateV6_(row.booking_date),
        booking_time: normalizeTimeV6_(row.booking_time),
        customer_name: row.customer_name || "",
        service_name: row.service_name || "",
        staff_name: row.staff_name || "",
        status: row.status || "booked",
        notes: row.notes || ""
      };
    });

  bookings.sort(function(a, b) {
    return String(a.booking_time).localeCompare(String(b.booking_time));
  });

  return bookings;
}

/**
 * Mengubah status booking.
 * Dipakai saat dropdown aksi status di tabel booking diubah.
 */
function updateBookingStatus(bookingId, newStatus) {
  if (!bookingId) {
    throw new Error("Booking ID kosong.");
  }

  if (!newStatus) {
    throw new Error("Status baru kosong.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Bookings");

  if (!sheet) {
    throw new Error("Sheet Bookings tidak ditemukan.");
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2) {
    throw new Error("Belum ada data booking.");
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(header) {
      return String(header || "").trim();
    });

  const bookingIdIndex = headers.indexOf("booking_id");
  const statusIndex = headers.indexOf("status");
  const updatedAtIndex = headers.indexOf("updated_at");

  if (bookingIdIndex === -1 || statusIndex === -1) {
    throw new Error("Header booking_id atau status tidak ditemukan.");
  }

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][bookingIdIndex]) === String(bookingId)) {
      const sheetRow = i + 2;

      sheet.getRange(sheetRow, statusIndex + 1).setValue(newStatus);

      if (updatedAtIndex > -1) {
        sheet.getRange(sheetRow, updatedAtIndex + 1).setValue(new Date());
      }

      return {
        success: true,
        message: "Status booking berhasil diubah"
      };
    }
  }

  throw new Error("Booking tidak ditemukan: " + bookingId);
}

/**
 * Normalisasi tanggal menjadi yyyy-MM-dd.
 * Mendukung input Date, yyyy-MM-dd, dan dd/MM/yyyy.
 */
function normalizeDateV6_(value) {
  if (!value) return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const text = String(value).trim();

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return match[1] + "-" + match[2] + "-" + match[3];
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const day = String(match[1]).padStart(2, "0");
    const month = String(match[2]).padStart(2, "0");
    const year = match[3];

    return year + "-" + month + "-" + day;
  }

  const fallback = new Date(value);

  if (!isNaN(fallback.getTime())) {
    return Utilities.formatDate(
      fallback,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  return text;
}

/**
 * Normalisasi jam menjadi HH:mm.
 */
function normalizeTimeV6_(value) {
  if (!value) return "";

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "HH:mm"
    );
  }

  return String(value).trim();
}

/**
 * Membuat ID singkat.
 * Contoh: BKG-A1B2C3D4
 */
function makeIdV6_(prefix) {
  const shortId = Utilities.getUuid().split("-")[0].toUpperCase();
  return prefix + "-" + shortId;
}

/**
 * Tes koneksi khusus Booking.
 * Jalankan dari Apps Script untuk memastikan backend aktif.
 */
function pingBookingBackendV6() {
  return "Booking Backend V6 aktif.";
}

/**
 * Tes dropdown Booking.
 * Jalankan dari Apps Script.
 * Harus menghasilkan jumlah services dan staff lebih dari 0.
 */
function testBookingInitialDataV6() {
  const data = getBookingInitialDataV6();

  Logger.log("Jumlah services: " + data.services.length);
  Logger.log("Jumlah staff: " + data.staff.length);
  Logger.log(JSON.stringify(data, null, 2));
}

/**
 * Tes simpan booking.
 * Jalankan dari Apps Script.
 */
function testSaveBookingV6() {
  const result = saveBooking({
    booking_date: "2026-05-18",
    booking_time: "13:00",
    customer_name: "Customer Booking V6",
    phone: "081111111111",
    instagram: "@bookingv6",
    service_id: "SVC001",
    staff_id: "STF001",
    status: "booked",
    notes: "Test booking V6"
  });

  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Tes ambil daftar booking berdasarkan tanggal.
 * Jalankan dari Apps Script.
 */
function testGetBookingsByDateV6() {
  const result = getBookingsByDateV6("2026-05-18");

  Logger.log("Jumlah booking ditemukan: " + result.length);
  Logger.log(JSON.stringify(result, null, 2));
}