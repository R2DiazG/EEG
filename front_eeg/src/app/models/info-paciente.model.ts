export class InfoPaciente {
    id_paciente?: number;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    // Asegúrate de que la fecha de nacimiento pueda ser manejada consistentemente como Date o como string
    fecha_nacimiento?: Date | string;  
    genero?: 'Masculino' | 'Femenino';
    edad?: number;
    notas_ultima_sesion?: string;

    estado_civil?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a';
    escolaridad?: 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Universidad' | 'Posgrado' | 'Otro';
    ocupacion?: 'Estudiante' | 'Empleado' | 'Empresario' | 'Independiente';
    lateralidad?: 'Izquierda' | 'Derecha' | 'ambidextrous';

    // Arrays inicializados para evitar problemas de "Object is possibly 'undefined'."
    telefonos: { telefono: string }[] = [];
    correos_electronicos: { correo_electronico: string }[] = [];
    direcciones: {
        calle_numero: string;
        colonia?: string; // Opcional
        ciudad: string;
        estado: string;
        pais: string;
        codigo_postal: string;
    }[] = [];
    historial_medico?: string;
    medicamentos_actuales: string[] = []; // Inicializado como vacío

    // Información de contacto de emergencia, opcional pero estructurada para claridad
    nombre_contacto_emergencia?: string;
    apellido_paterno_contacto_emergencia?: string;
    apellido_materno_contacto_emergencia?: string;
    parentesco_contacto_emergencia?: string;
    telefono_contacto_emergencia?: string;
    correo_electronico_contacto_emergencia?: string;
    direccion_contacto_emergencia?: string;
    ciudad_contacto_emergencia?: string;
    estado_contacto_emergencia?: string;
    codigo_postal_contacto_emergencia?: string;
    pais_contacto_emergencia?: string;
    notas_contacto_emergencia?: string;

    // Los consentimientos se manejan como un array de objetos con la estructura dada
    consentimientos: { 
        consentimiento: boolean; 
        fecha_registro: Date 
    }[] = [];
}
