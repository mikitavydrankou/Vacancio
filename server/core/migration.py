import os
import shutil
import logging

logger = logging.getLogger(__name__)

def migrate_data(data_dir: str, legacy_db_path: str, legacy_uploads_path: str):
    """
    Migrates data from legacy locations (root folder) to the new data directory.
    This handles the case where a user upgrades from v1 to v2.
    """
    new_db_path = os.path.join(data_dir, "vacancio.db")
    new_uploads_dir = os.path.join(data_dir, "uploads")

    # 1. Migrate Database
    if os.path.exists(legacy_db_path) and not os.path.exists(new_db_path):
        logger.warning(f"Feature: Migrating legacy database from {legacy_db_path} to {new_db_path}...")
        try:
            shutil.move(legacy_db_path, new_db_path)
            logger.info("✅ Database migration successful.")
        except Exception as e:
            logger.error(f"❌ Database migration failed: {e}")

    # 2. Migrate Uploads
    if os.path.exists(legacy_uploads_path):
        # If new uploads dir doesn't exist, just move the whole folder
        if not os.path.exists(new_uploads_dir):
            logger.warning(f"Feature: Migrating legacy uploads from {legacy_uploads_path} to {new_uploads_dir}...")
            try:
                shutil.move(legacy_uploads_path, new_uploads_dir)
                logger.info("✅ Uploads folder migration successful.")
            except Exception as e:
                logger.error(f"❌ Uploads migration failed: {e}")
        
        # If new uploads dir DOES exist (maybe partial run?), move contents
        else:
            logger.info(f"Merging legacy uploads into {new_uploads_dir}...")
            for item in os.listdir(legacy_uploads_path):
                s = os.path.join(legacy_uploads_path, item)
                d = os.path.join(new_uploads_dir, item)
                if not os.path.exists(d):
                    try:
                        shutil.move(s, d)
                    except Exception as e:
                         logger.error(f"Failed to move {s}: {e}")
            
            # Try to remove the empty legacy folder
            try:
                os.rmdir(legacy_uploads_path)
            except:
                pass
