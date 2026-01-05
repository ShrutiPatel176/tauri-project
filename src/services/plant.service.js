import { db } from "@/db";

export async function getPlants() {
  return await db.plants.toArray();
}

export async function getPlantById(id) {
  return await db.plants.get(id);
}

export async function getPlantsByCountry(country) {
  return await db.plants.where("country").equals(country.toLowerCase()).toArray();
}

export async function getPlantsByAdmin(adminId) {
  return await db.plants.where("createdByAdminId").equals(adminId).toArray();
}

export async function addPlant(plantData) {
  return await db.plants.add(plantData);
}

export async function updatePlant(id, plantData) {
  return await db.plants.update(id, plantData);
}

export async function deletePlant(id) {
  return await db.plants.delete(id);
}

export async function getPlantsWithLowStock(limit = 5) {
  return await db.plants.where("quantity").belowOrEqual(limit).toArray();
}

export async function getOutOfStockPlants() {
  return await db.plants.where("quantity").equals(0).toArray();
}

export async function searchPlants(query) {
  const allPlants = await db.plants.toArray();
  return allPlants.filter(plant => 
    plant.name.toLowerCase().includes(query.toLowerCase()) ||
    plant.country.toLowerCase().includes(query.toLowerCase())
  );
}
