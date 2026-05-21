-- Hapus customer "Walk-in Customer" yang gak punya transaksi
DELETE FROM customers 
WHERE customer_name = 'Walk-in Customer' 
  AND customer_id NOT IN (SELECT DISTINCT customer_id FROM transactions WHERE customer_id IS NOT NULL);

-- Update customer "Walk-in Customer" yang PUNYA transaksi → ganti nama dari nomor transaksi pertama mereka
UPDATE customers c
SET customer_name = tx.first_name
FROM (
  SELECT DISTINCT ON (customer_id) customer_id, 
         COALESCE(NULLIF(customer_name, ''), 'Customer-' || SUBSTRING(transaction_id::text, 1, 8)) AS first_name
  FROM transactions 
  WHERE customer_id IN (SELECT customer_id FROM customers WHERE customer_name = 'Walk-in Customer')
  ORDER BY customer_id, transaction_date ASC
) tx
WHERE c.customer_id = tx.customer_id
  AND c.customer_name = 'Walk-in Customer';
