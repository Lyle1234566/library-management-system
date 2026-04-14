# Generated migration for Active Students metric

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0027_book_description'),
    ]

    operations = [
        # Create indexes for performance optimization
        migrations.RunSQL(
            sql="""
                -- Index on borrow_requests for student activity
                CREATE INDEX IF NOT EXISTS idx_borrow_requests_user_created 
                ON books_borrowrequest(user_id, requested_at);
                
                -- Index on fine_payments for student activity
                CREATE INDEX IF NOT EXISTS idx_fine_payments_user_created 
                ON books_finepayment(borrow_request_id, created_at);
                
                -- Index on reservations for student activity
                CREATE INDEX IF NOT EXISTS idx_reservations_user_created 
                ON books_reservation(user_id, created_at);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS idx_borrow_requests_user_created;
                DROP INDEX IF EXISTS idx_fine_payments_user_created;
                DROP INDEX IF EXISTS idx_reservations_user_created;
            """
        ),
        
        # Create the active students count function
        migrations.RunSQL(
            sql="""
                CREATE OR REPLACE FUNCTION get_active_students_count(days_window INTEGER DEFAULT 30)
                RETURNS INTEGER AS $$
                DECLARE
                    cutoff_date TIMESTAMP;
                    active_count INTEGER;
                BEGIN
                    -- Calculate cutoff date
                    cutoff_date := NOW() - (days_window || ' days')::INTERVAL;
                    
                    -- Count unique active students with library activity
                    SELECT COUNT(DISTINCT user_id) INTO active_count
                    FROM (
                        -- Students with borrow requests
                        SELECT DISTINCT br.user_id
                        FROM books_borrowrequest br
                        INNER JOIN user_user u ON br.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND br.requested_at >= cutoff_date
                        
                        UNION
                        
                        -- Students with approved borrows (borrowed_at = processed_at when approved)
                        SELECT DISTINCT br.user_id
                        FROM books_borrowrequest br
                        INNER JOIN user_user u ON br.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND br.status = 'APPROVED'
                          AND br.processed_at >= cutoff_date
                        
                        UNION
                        
                        -- Students with returned books
                        SELECT DISTINCT br.user_id
                        FROM books_borrowrequest br
                        INNER JOIN user_user u ON br.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND br.status = 'RETURNED'
                          AND br.processed_at >= cutoff_date
                        
                        UNION
                        
                        -- Students with renewal activity
                        SELECT DISTINCT br.user_id
                        FROM books_borrowrequest br
                        INNER JOIN user_user u ON br.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND br.last_renewed_at >= cutoff_date
                        
                        UNION
                        
                        -- Students with fine payments
                        SELECT DISTINCT br.user_id
                        FROM books_finepayment fp
                        INNER JOIN books_borrowrequest br ON fp.borrow_request_id = br.id
                        INNER JOIN user_user u ON br.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND fp.created_at >= cutoff_date
                        
                        UNION
                        
                        -- Students with reservations
                        SELECT DISTINCT r.user_id
                        FROM books_reservation r
                        INNER JOIN user_user u ON r.user_id = u.id
                        WHERE u.role = 'STUDENT'
                          AND u.is_active = true
                          AND r.created_at >= cutoff_date
                    ) AS active_students;
                    
                    RETURN COALESCE(active_count, 0);
                END;
                $$ LANGUAGE plpgsql;
                
                -- Create a simpler view for quick access
                CREATE OR REPLACE VIEW active_students_last_30_days AS
                SELECT get_active_students_count(30) AS count;
            """,
            reverse_sql="""
                DROP VIEW IF EXISTS active_students_last_30_days;
                DROP FUNCTION IF EXISTS get_active_students_count(INTEGER);
            """
        ),
    ]
