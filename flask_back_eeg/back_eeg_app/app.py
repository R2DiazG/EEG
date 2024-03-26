from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
import os

# Cargar las variables de entorno
load_dotenv()

# Inicializar la aplicación Flask
app = Flask(__name__)

# Configurar la aplicación
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar las extensiones
db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Importar los modelos
from models import Usuario, Rol, Genero, EstadoCivil, Escolaridad, Lateralidad, Ocupacion, Paciente, Telefono, CorreoElectronico, Direccion

# Ruta para verificar la salud de la aplicación
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'up'}), 200

# Rutas de la API (ejemplo para registro y autenticación)
@app.route('/register', methods=['POST'])
def register():
    # Asumiendo que se envía un JSON con 'username' y 'password'
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = Usuario(username=data['username'], contraseña=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully.'}), 201

@app.route('/login', methods=['POST'])
def login():
    # Asumiendo que se envía un JSON con 'username' y 'password'
    data = request.get_json()
    user = Usuario.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.contraseña, data['password']):
        token = create_access_token(identity=user.id_usuario)
        return jsonify({'token': token}), 200
    else:
        return jsonify({'message': 'Invalid username or password'}), 401

# Rutas adicionales para CRUD de otros modelos

# Manejador global de errores
@app.errorhandler(Exception)
def handle_exception(error):
    return jsonify({'message': str(error)}), 500

# Iniciar la aplicación
if __name__ == '__main__':
    app.run(debug=True)
