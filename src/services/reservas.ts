export interface CreateReservaDto {
	areaId: number;
	inicio: string;
	fin: string;
	costo: number;
}

export interface Reserva {
	id: number;
	areaId: number;
	usuarioId: string;
	inicio: string;
	fin: string;
	estado: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
	costo: number;
	createdAt: string;
	updatedAt: string;
}
