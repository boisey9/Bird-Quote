import { useEffect, useState } from 'react';
import { Image, RefreshCw, Save } from 'lucide-react';
import { saveVehicleMatrixCms, seedVehicleMatrixCms, toVehicleMatrixCmsData, type VehicleMatrixCmsData } from '../../hooks/useVehicleMatrixCms';
import './VehicleMatrixAdminEditor.css';

type VehicleMatrixCmsPayload = Partial<VehicleMatrixCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
};

async function parseVehicleMatrixResponse(response: Response): Promise<VehicleMatrixCmsPayload> {
  const text = await response.text();
  let payload: VehicleMatrixCmsPayload;
  try {
    payload = text ? JSON.parse(text) as VehicleMatrixCmsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Vehicle Matrix CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Vehicle Matrix CMS request failed (${response.status}).`);
  return payload;
}

export function VehicleMediaAdminEditor() {
  const [matrix, setMatrix] = useState<VehicleMatrixCmsData>(() => seedVehicleMatrixCms());
  const [status, setStatus] = useState('Loading vehicle media fields...');

  async function loadMatrix() {
    setStatus('Loading vehicle media fields...');
    try {
      const payload = await parseVehicleMatrixResponse(await fetch('/api/cms-vehicle-matrix'));
      setMatrix(toVehicleMatrixCmsData(payload));
      setStatus(payload.source === 'empty-neon' ? 'Showing seed matrix. Save from this panel to initialize media fields.' : 'Loaded vehicle media fields from Neon.');
    } catch (error) {
      setMatrix(seedVehicleMatrixCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed matrix.` : 'Unable to load vehicle media fields.');
    }
  }

  useEffect(() => { loadMatrix(); }, []);

  function updateChassisImage(id: string, imageUrl: string) {
    setMatrix((current) => ({ ...current, chassis: current.chassis.map((item) => item.id === id ? { ...item, imageUrl } : item) }));
    setStatus('Unsaved vehicle image changes.');
  }

  function updateBusTypeImage(id: string, imageUrl: string) {
    setMatrix((current) => ({ ...current, busTypes: current.busTypes.map((item) => item.id === id ? { ...item, imageUrl } : item) }));
    setStatus('Unsaved bus image changes.');
  }

  function updateCertificationImage(id: string, imageUrl: string) {
    setMatrix((current) => ({ ...current, certifications: current.certifications.map((item) => item.id === id ? { ...item, imageUrl } : item) }));
    setStatus('Unsaved certification image changes.');
  }

  function updateWheelbaseImage(id: string, imageUrl: string) {
    setMatrix((current) => ({ ...current, wheelbases: current.wheelbases.map((item) => item.id === id ? { ...item, imageUrl } : item) }));
    setStatus('Unsaved wheelbase image changes.');
  }

  async function save() {
    setStatus('Saving vehicle media fields...');
    try {
      const result = await saveVehicleMatrixCms(matrix);
      setMatrix(toVehicleMatrixCmsData(result));
      setStatus('Saved vehicle image URLs.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save vehicle image URLs.');
    }
  }

  return (
    <div className="vehicleMediaEditor">
      <div className="floorPlanHeader vehicleEditorHeader">
        <div>
          <small>Vehicle Media</small>
          <strong><Image size={18} /> Images for customer-facing selection cards</strong>
          <p>Add image URLs for chassis, bus/model types, certifications, and wheelbases. These URLs are used by the customer Bus Selection page when available.</p>
        </div>
        <div className="floorPlanAdminActions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadMatrix}><RefreshCw size={14} /> Reload</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save Images</button>
        </div>
      </div>
      <div className="submitStatus cmsSaveStatus">{status}</div>

      <div className="vehicleMediaGrid">
        <section>
          <h4>Chassis Selection Images</h4>
          {matrix.chassis.map((item) => <label key={item.id}><span>{item.name}</span><input value={item.imageUrl ?? ''} placeholder="/images/chassis/ford-e-series.png or https://..." onChange={(event) => updateChassisImage(item.id, event.target.value)} /></label>)}
        </section>
        <section>
          <h4>Bus Type / Model Images</h4>
          {matrix.busTypes.map((item) => <label key={item.id}><span>{item.name}</span><input value={item.imageUrl ?? ''} placeholder="/images/bus-types/commercial.png or https://..." onChange={(event) => updateBusTypeImage(item.id, event.target.value)} /></label>)}
        </section>
        <section>
          <h4>Certification / Package Images</h4>
          {matrix.certifications.map((item) => <label key={item.id}><span>{item.name}</span><input value={item.imageUrl ?? ''} placeholder="Optional package image URL" onChange={(event) => updateCertificationImage(item.id, event.target.value)} /></label>)}
        </section>
        <section>
          <h4>Wheelbase Images</h4>
          {matrix.wheelbases.map((item) => <label key={item.id}><span>{item.name}</span><input value={item.imageUrl ?? ''} placeholder="Optional wheelbase image URL" onChange={(event) => updateWheelbaseImage(item.id, event.target.value)} /></label>)}
        </section>
      </div>
    </div>
  );
}
