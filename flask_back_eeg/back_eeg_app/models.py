from app import db
from datetime import datetime

# Definición de la tabla de asociación
paciente_medicamento = db.Table('paciente_medicamento',
    db.Column('id_paciente', db.Integer, db.ForeignKey('pacientes.id_paciente'), primary_key=True),
    db.Column('id_medicamento', db.Integer, db.ForeignKey('medicamentos.id_medicamento'), primary_key=True)
)

# Modelo para Roles
class Rol(db.Model):
    __tablename__ = 'roles'
    id_rol = db.Column(db.Integer, primary_key=True)
    rol = db.Column(db.String(255), unique=True, nullable=False)
    descripcion = db.Column(db.Text)

# Modelo para Usuarios
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255))
    apellidos = db.Column(db.String(255))
    username = db.Column(db.String(255), unique=True)
    contraseña = db.Column(db.String(255))  # Considerar el uso de bcrypt para hashing
    correo = db.Column(db.String(255), unique=True)
    aprobacion = db.Column(db.Boolean, nullable=False)
    id_rol = db.Column(db.Integer, db.ForeignKey('roles.id_rol'))

# Modelo para Géneros
class Genero(db.Model):
    __tablename__ = 'generos'
    id_genero = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Modelo para Estados Civiles
class EstadoCivil(db.Model):
    __tablename__ = 'estados_civiles'
    id_estado_civil = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(50), nullable=False)

# Modelo para Escolaridades
class Escolaridad(db.Model):
    __tablename__ = 'escolaridades'
    id_escolaridad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Lateralidades
class Lateralidad(db.Model):
    __tablename__ = 'lateralidades'
    id_lateralidad = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Ocupaciones
class Ocupacion(db.Model):
    __tablename__ = 'ocupaciones'
    id_ocupacion = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)

# Modelo para Pacientes
class Paciente(db.Model):
    __tablename__ = 'pacientes'
    id_paciente = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))
    nombre = db.Column(db.String(255), nullable=False)
    apellido_paterno = db.Column(db.String(255), nullable=False)
    apellido_materno = db.Column(db.String(255))
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    id_genero = db.Column(db.Integer, db.ForeignKey('generos.id_genero'))
    id_estado_civil = db.Column(db.Integer, db.ForeignKey('estados_civiles.id_estado_civil'))
    id_escolaridad = db.Column(db.Integer, db.ForeignKey('escolaridades.id_escolaridad'))
    id_lateralidad = db.Column(db.Integer, db.ForeignKey('lateralidades.id_lateralidad'))
    id_ocupacion = db.Column(db.Integer, db.ForeignKey('ocupaciones.id_ocupacion'))

    # Relaciones adicionales
    telefonos = db.relationship('Telefono', backref='paciente', lazy=True)
    correos_electronicos = db.relationship('CorreoElectronico', backref='paciente', lazy=True)
    direcciones = db.relationship('Direccion', backref='paciente', lazy=True)
    historiales_medicos = db.relationship('HistorialMedico', backref='paciente', lazy=True)
    sesiones = db.relationship('Sesion', backref='paciente', lazy=True)
    consentimientos = db.relationship('Consentimiento', backref='paciente', lazy=True)
    raw_eegs = db.relationship('RawEEG', backref='paciente', lazy=True)
    normalized_eegs = db.relationship('NormalizedEEG', backref='paciente', lazy=True)
    diagnosticos_previos = db.relationship('DiagnosticoPrevio', backref='paciente', lazy=True)
    # Como PacienteMedicamento es una asociación
    medicamentos = db.relationship('Medicamento', secondary=paciente_medicamento, backref=db.backref('pacientes', lazy=True))

# Modelo para Teléfonos
class Telefono(db.Model):
    __tablename__ = 'telefonos'
    id_telefono = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    telefono = db.Column(db.String(255), nullable=False)

# Modelo para Correos Electrónicos
class CorreoElectronico(db.Model):
    __tablename__ = 'correos_electronicos'
    id_correo = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    correo_electronico = db.Column(db.String(255), unique=True, nullable=False)

# Modelo para Direcciones
class Direccion(db.Model):
    __tablename__ = 'direcciones'
    id_direccion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'))
    calle_numero = db.Column(db.String(255))
    colonia = db.Column(db.String(255))
    ciudad = db.Column(db.String(255))
    estado = db.Column(db.String(255))
    pais = db.Column(db.String(255))
    codigo_postal = db.Column(db.String(20))

class HistorialMedico(db.Model):
    id_historial_medico = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    historial_medico = db.Column(db.Text)

class DiagnosticoPrevio(db.Model):
    id_diagnostico_previo = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    descripcion = db.Column(db.Text)

class Sesion(db.Model):
    __tablename__ = 'sesiones'
    id_sesion = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    fecha_consulta = db.Column(db.Date, nullable=False)
    resumen_sesion_actual = db.Column(db.Text)
    notas_psicologo = db.Column(db.Text)

class Consentimiento(db.Model):
    __tablename__ = 'consentimientos'
    id_consentimiento = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    consentimiento = db.Column(db.Boolean, nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False)

class Medicamento(db.Model):
    __tablename__ = 'medicamentos'
    id_medicamento = db.Column(db.Integer, primary_key=True)
    nombre_comercial = db.Column(db.String(255))
    principio_activo = db.Column(db.String(255))
    presentacion = db.Column(db.String(255))

class MetricaDesempeno(db.Model):
    __tablename__ = 'metricas_desempeno'
    id_metrica = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Decimal(10, 4))
    fecha_hora_registro = db.Column(db.DateTime, nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))

class LogActividadUsuario(db.Model):
    __tablename__ = 'logs_actividad_usuarios'
    id_log = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'))
    accion = db.Column(db.Text, nullable=False)
    fecha_hora_accion = db.Column(db.DateTime, nullable=False)

class ResultadoPrediccion(db.Model):
    __tablename__ = 'resultados_prediccion'
    id_resultado_prediccion = db.Column(db.Integer, primary_key=True)
    id_eeg_procesado = db.Column(db.Integer, db.ForeignKey('normalized_eeg.id_eeg_procesado'))
    resultado_prediccion = db.Column(db.Text, nullable=False)
    nivel_confianza = db.Column(db.Decimal(5, 2))
    fecha_hora_prediccion = db.Column(db.DateTime, nullable=False)

class RawEEG(db.Model):
    __tablename__ = 'raw_eeg'
    id_eeg = db.Column(db.Integer, primary_key=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    fecha_hora_registro = db.Column(db.DateTime, nullable=False)
    Fp1 = db.Column(db.Float)
    F3 = db.Column(db.Float)
    C3 = db.Column(db.Float)
    P3 = db.Column(db.Float)
    O1 = db.Column(db.Float)
    F7 = db.Column(db.Float)
    T3 = db.Column(db.Float)
    T5 = db.Column(db.Float)
    Fz = db.Column(db.Float)
    Fp2 = db.Column(db.Float)
    F4 = db.Column(db.Float)
    C4 = db.Column(db.Float)
    P4 = db.Column(db.Float)
    O2 = db.Column(db.Float)
    F8 = db.Column(db.Float)
    T4 = db.Column(db.Float)
    T6 = db.Column(db.Float)
    Cz = db.Column(db.Float)
    Pz = db.Column(db.Float)

class NormalizedEEG(db.Model):
    __tablename__ = 'normalized_eeg'
    id_eeg_procesado = db.Column(db.Integer, primary_key=True)
    id_eeg = db.Column(db.Integer, db.ForeignKey('raw_eeg.id_eeg'), nullable=False)
    fecha_hora_procesado = db.Column(db.DateTime, nullable=False)
    pointStart = db.Column(db.Float)
    pointInterval = db.Column(db.Float)
    Fp1 = db.Column(db.Float)
    F3 = db.Column(db.Float)
    C3 = db.Column(db.Float)
    P3 = db.Column(db.Float)
    O1 = db.Column(db.Float)
    F7 = db.Column(db.Float)
    T3 = db.Column(db.Float)
    T5 = db.Column(db.Float)
    Fz = db.Column(db.Float)
    Fp2 = db.Column(db.Float)
    F4 = db.Column(db.Float)
    C4 = db.Column(db.Float)
    P4 = db.Column(db.Float)
    O2 = db.Column(db.Float)
    F8 = db.Column(db.Float)
    T4 = db.Column(db.Float)
    T6 = db.Column(db.Float)
    Cz = db.Column(db.Float)
    Pz = db.Column(db.Float)