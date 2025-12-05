import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    
    # Asegurar que apunte a la carpeta instance
    basedir = os.path.abspath(os.path.dirname(__file__))
    instance_path = os.path.join(basedir, 'instance')
    
    # Crear la carpeta instance si no existe
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
    
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(instance_path, "mercadb.sqlite3")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Para debug - ver las consultas SQL
    SQLALCHEMY_ECHO = True
