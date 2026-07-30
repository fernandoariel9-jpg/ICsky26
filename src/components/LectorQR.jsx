        <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%" }}
        />

        <button
          onClick={onCerrar}
          className="mt-4 w-full bg-red-600 text-white rounded py-2"
        >
          Cancelar
        </button>

      </div>

    </div>

  );
}
