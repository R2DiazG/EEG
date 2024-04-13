export class InfoPaciente {
    id_paciente?: number;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    // Asegúrate de que la fecha de nacimiento pueda ser manejada consistentemente como Date o como string
    fecha_nacimiento?: Date | string;  
    id_genero?: number;
    id_estado_civil?: number;
    id_escolaridad?: number;
    id_ocupacion?: number;
    id_lateralidad?: number;

    edad?: number;
    notas_ultima_sesion?: string;

    genero?: 'Masculino' | 'Femenino';
    estado_civil?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a';
    escolaridad?: 'Primaria' | 'Secundaria' | 'Preparatoria' | 'Universidad' | 'Maestria' | 'Doctorado' | 'Sin estudios';
    ocupacion?: 'Estudiante' | 'Empleado' | 'Empresario' | 'Independiente' | 'Desempleado';
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

    // Información de contacto de emergencia, opcional pero estructurada para claridad
    contacto_emergencia: {
        nombre?: string;
        apellido_paterno?: string;
        apellido_materno?: string;
        ciudad?: string;
        codigo_postal?: string;
        correo_electronico: string;
        direccion: string;
        estado: string;
        notas: string;
        pais: string;
        parentesco: string;
        telefono: string;
    } = {} as any;

    // Los consentimientos se manejan como un array de objetos con la estructura dada
    /*
    consentimientos: {
        audioUrl: string;
        fecha_registro: string;
    } = { audioUrl: '', fecha_registro: '' };
    */
    consentimientos: {
        consentimiento: number; 
        fecha_registro: string
    }[] = [];
}
