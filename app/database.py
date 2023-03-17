import mariadb
import sys

class Database:
    def __init__(self, user, password, host, port, database):
        # Make the database connection
        try:
            conn = mariadb.connect(
                user=user,
                password=password,
                host=host,
                port=port,
                database=database
            )


        except mariadb.Error as e:
            print(f"Error connecting to MariaDB Platform: {e}")
            sys.exit(1)

        self.conn = conn
        self.cur = conn.cursor()
