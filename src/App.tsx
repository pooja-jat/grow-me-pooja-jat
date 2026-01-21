import { useEffect, useMemo, useRef, useState } from "react";

import { Column } from "primereact/column";
import { Button } from "primereact/button";
import type {
  PaginatorCurrentPageReportOptions,
  PaginatorNextPageLinkOptions,
  PaginatorPrevPageLinkOptions,
} from "primereact/paginator";
import {
  DataTable,
  type DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import type { ApiResponse, Art } from "./type";
import 'primeicons/primeicons.css';


const App = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [response, setResponse] = useState<ApiResponse>();

  const arts = useMemo(() => response?.data || [], [response]);
  
  const selectedRows = useMemo(() => arts.filter((art) => selectedIds.includes(art.id)), [arts, selectedIds]);

  const [selectRowCount, setSelectRowCount] = useState<number | null>(null);
  const overlayPanelRef = useRef<OverlayPanel>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${pageSize}`,
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch artworks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);


  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <h3>Error loading artworks</h3>
        <p>{error}</p>
        <button onClick={() => fetchData()}>Retry</button>
      </div>
    );
  }

  const paginatorTemplate = {
    layout: "CurrentPageReport PrevPageLink PageLinks NextPageLink",
    CurrentPageReport: (options: PaginatorCurrentPageReportOptions) => {
        return (
        <span style={{ color: "#6c757d", marginRight: "auto" }}>
          Showing <b>{options.first}</b> to
          <b>{options.last}</b>
          of <b>{options.totalRecords}</b> entries
        </span>
      );
    },
    PrevPageLink: (options: PaginatorPrevPageLinkOptions) => {
      return (
        <Button outlined disabled={options.disabled} onClick={options.onClick}>
          Previous
        </Button>
      );
    },
    NextPageLink: (options: PaginatorNextPageLinkOptions) => {
      return (
        <Button outlined disabled={options.disabled} onClick={options.onClick}>
          Next
        </Button>
      );
    },
  };


  const handleSelectionChange = (
    e: DataTableSelectionMultipleChangeEvent<Art[]>,
  ) => {
    const newSelectedRows = e.value as Art[];
    const newSelectedIds = newSelectedRows.map((art) => art.id);
    const currentPageIds = arts.map((art) => art.id);
    setSelectedIds((prev) => {
      const withoutCurrentPage = prev.filter(
        (id) => !currentPageIds.includes(id),
      );
      return [...withoutCurrentPage, ...newSelectedIds];
    });
  };

  const handleSelectMultiple = async () => {
    if (!selectRowCount || selectRowCount <= 0) return;

    const idsToSelect = arts.slice(0, selectRowCount).map((art) => art.id);
    setSelectedIds(idsToSelect);
    setSelectRowCount(null);
    overlayPanelRef.current?.hide();
  };



  return (
    <div style={{ padding: "20px" }}>
        <div className="selected-count-label">
          Selected: <span className="count">{selectedIds.length}</span> rows
        </div>

      {/* Multi-select overlay panel */}
      <OverlayPanel ref={overlayPanelRef} className="select-multiple-panel">
        <div className="panel-content">
          <h4>Select Multiple Rows</h4>
          <p>Enter number of rows to select across all pages</p>
          <div className="input-row">
            <InputNumber
              value={selectRowCount}
              onValueChange={(e) => setSelectRowCount(e.value ?? null)}
              min={1}
              max={pageSize}
              placeholder="Enter number"
              className="row-count-input"
            />
            <Button label="Select" onClick={handleSelectMultiple} className="select-button"/>
          </div>
        </div>
      </OverlayPanel>

      <DataTable
        selectionMode="checkbox"
        selection={selectedRows}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        value={arts}
        lazy
        loading={loading}
        paginator
        stripedRows
        paginatorTemplate={paginatorTemplate}
        scrollable
        scrollHeight="80vh"
        rows={pageSize}
        totalRecords={response?.pagination?.total}
        first={(page - 1) * pageSize}
        onPage={(e) => {
          setPage(Math.floor(e.first / pageSize) + 1);
          setPageSize(e.rows);
        }}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column 
          selectionMode="multiple" 
          headerStyle={{ width: "5rem" }} 
          header={
            <i 
              className="pi pi-chevron-down" 
              style={{ 
                cursor: "pointer", 
                marginLeft: "4px", 
                fontSize: "0.85rem",
                color: "#6c757d",
                padding: 8,
              }}
              onClick={(e) => overlayPanelRef.current?.toggle(e)}
              title="Select multiple rows"
            />
          }
        />
        <Column field="title" header="TITLE" style={{ width: "25%", fontWeight: "bold" }} />
        <Column field="place_of_origin" header="PLACE OF ORIGIN" style={{ width: "300px" }} />
        <Column field="artist_display" header="ARTIST" style={{ width: "25%" }} />
        <Column field="inscriptions" header="INSCRIPTIONS" style={{ width: "25%" }} body={(rowData) => rowData.inscriptions || "N/A"}/>
        <Column field="date_start" header="START DATE" style={{ width: "300px" }} />
        <Column field="date_end" header="END DATE" style={{ width: "300px" }} />
      </DataTable>
    </div>
  );
};

export default App;
