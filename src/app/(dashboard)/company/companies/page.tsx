"use client";

import { useState } from "react";
import { mockedCompanies, companyCategories } from "@/features/shared/data/mockDB";
import { CompanyCard } from "@/features/companies/components/CompanyCard";
import { Building, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CompaniesDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredCompanies = mockedCompanies.filter((company) => {
    if (company.status !== "approved") return false;
    
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          company.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || company.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header section with gradient */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 py-16 text-white relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Badge className="bg-primary-500/20 text-primary-100 hover:bg-primary-500/30 border-primary-500/30 mb-4 px-3 py-1">
                Directorio Industrial
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-white">
                Empresas Asociadas
              </h1>
              <p className="text-lg text-primary-100/90 font-medium">
                Descubre los perfiles y servicios de las empresas que forman parte de la Unión Industrial de Almirante Brown.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empresas por nombre o servicio..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-64 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-slate-700 font-medium"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todos los sectores</option>
            {companyCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Results Info */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {filteredCompanies.length} empresas encontradas
          </h2>
        </div>

        {/* Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompanies.map((comp) => (
              <CompanyCard key={comp.id} company={comp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No se encontraron empresas</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Intenta ajustar tus filtros de búsqueda o intentalo con otro sector industrial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
