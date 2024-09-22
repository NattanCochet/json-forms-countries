"use client"; //next n'autorise pas useeffect/usestate sans ce mot clé

import React, { useState, useEffect, useCallback } from "react";
import { JsonForms } from "@jsonforms/react";
import { materialRenderers } from "@jsonforms/material-renderers";
import { materialCells } from "@jsonforms/material-renderers";

interface BaseValues {
  [key: string]: number;
}

interface InfoPays {
  Liste_pays_iconnu_compris: string;
  pourcentPays: number;
}

const Home = () => {
  const [baseValues, setBaseValues] = useState<BaseValues>({
    France: 0,
    Allemagne: 0,
    Belgique: 0,
    Inconnu: 0,
  });

  const getPercentages = useCallback((baseValues: BaseValues) => {
    const total = Object.values(baseValues).reduce(
      (acc, value) => acc + value,
      0
    );
    if (total === 0) {
      return baseValues;
    } else {
      return Object.fromEntries(
        Object.entries(baseValues).map(([country, value]) => [
          country,
          Number(((value / total) * 100).toFixed(2)),
        ])
      );
    }
  }, []);

  const schema = {
    type: "object",
    properties: {
      nom: { type: "string", minLength: 4 },
      Pays: {
        type: "array",
        items: {
          type: "object",
          properties: {
            Liste_pays_iconnu_compris: {
              type: "string",
              enum: ["France", "Allemagne", "Belgique", "Inconnu"],
            },
            pourcentPays: {
              type: "number",
              readOnly: true,
            },
          },
          required: ["Liste_pays_iconnu_compris"],
        },
      },
    },
    required: ["nom", "Pays"],
  };

  const uischema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/nom",
      },
      {
        type: "Control",
        scope: "#/properties/Pays",
        options: {
          detail: {
            elements: [
              {
                type: "Control",
                scope: "#/properties/Liste_pays_iconnu_compris",
              },
              {
                type: "Control",
                scope: "#/properties/pourcentPays",
                options: {
                  readOnly: true,
                },
              },
            ],
          },
        },
      },
    ],
  };

  const [data, setData] = useState<{
    Pays: InfoPays[];
  }>({
    Pays: [{ Liste_pays_iconnu_compris: "France", pourcentPays: 0 }],
  });

  const [previousCountries, setPreviousCountries] = useState<string[]>([]);

  useEffect(() => {
    const currentCountries = data.Pays.map(
      (item: InfoPays) => item.Liste_pays_iconnu_compris
    );

    if (
      JSON.stringify(previousCountries) !== JSON.stringify(currentCountries)
    ) {
      const newBaseValues = { ...baseValues };

      currentCountries.forEach((country) => {
        if (!previousCountries.includes(country)) {
          newBaseValues[country] = (newBaseValues[country] || 0) + 1;
        }
      });

      previousCountries.forEach((country) => {
        if (!currentCountries.includes(country)) {
          newBaseValues[country] = Math.max(
            (newBaseValues[country] || 0) - 1,
            0
          );
        }
      });

      setBaseValues(newBaseValues);
      setPreviousCountries(currentCountries);

      const updatedPays = data.Pays.map((item: InfoPays) => ({
        ...item,
        pourcentPays:
          getPercentages(newBaseValues)[item.Liste_pays_iconnu_compris] || 0,
      }));

      setData((prevData) => ({
        ...prevData,
        Pays: updatedPays,
      }));
    }
  }, [data.Pays, baseValues, previousCountries, getPercentages]);

  const handleChange = ({ data }: { data: { Pays: InfoPays[] } }) => {
    setData(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={materialRenderers}
        onChange={handleChange}
        cells={materialCells}
      />

      <pre style={{ paddingTop: "2em" }}>{JSON.stringify(data, null, 2)}</pre>
      <pre style={{ paddingTop: "2em" }}>
        Base Values: {JSON.stringify(baseValues, null, 2)}
      </pre>
    </div>
  );
};

export default Home;
