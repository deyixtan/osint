import { useEffect, useState } from "react";
import {
  Link,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from "@chakra-ui/react";

const StalkOutput = ({ ws }) => {
  const [stalkResults, setStalkResults] = useState([]);

  useEffect(() => {
    const messageHandler = (event) => {
      const { topic, obj } = JSON.parse(event.data);
      if (topic == "clearResults") setStalkResults([]);
      else if (topic == "stalkResult") {
        setStalkResults((prevResults) => prevResults.concat(obj));
      }
    };

    ws.addEventListener("message", messageHandler);

    return () => {
      ws.removeEventListener("message", messageHandler);
    };
  }, []);

  return (
    <TableContainer>
      <Table variant="simple">
        <TableCaption>Stalk Results</TableCaption>
        <Thead>
          <Tr>
            <Th>Hit</Th>
            <Th>Error</Th>
            <Th>Site Name</Th>
            <Th>Site URL</Th>

            <Th>Wayback Count</Th>
            <Th>Wayback URL</Th>
          </Tr>
        </Thead>
        <Tbody>
          {stalkResults.map((result) => {
            return (
              <Tr key={result.site_name}>
                <Td>{result.hit ? "YES" : "NO"}</Td>
                <Td>{result.error}</Td>
                <Td>{result.site_name}</Td>
                <Td>
                  <Link href={result.site_url} isExternal>
                    {result.site_url}
                  </Link>
                </Td>
                <Td>{result.wayback_count}</Td>
                <Td>
                  <Link href={result.wayback_url} isExternal>
                    {result.wayback_url}
                  </Link>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
        <Tfoot></Tfoot>
      </Table>
    </TableContainer>
  );
};

export default StalkOutput;
