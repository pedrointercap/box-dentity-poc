import { useCallback, useEffect, useMemo, useState } from "react";
import { GetEnsTextReturnType, normalize } from "viem/ens";
import { publicClient } from "./client";
import "./App.css";
import { getVerificationPresentations } from "./dentity";
import { VerifiableCredentialPresentation } from "./common/interfaces";
import { CredentialTemplate } from "./common/enums";
import { FaInstagram, FaXTwitter } from "react-icons/fa6";
import { MdVerified } from "react-icons/md";
import { debounce } from "./util/debounce";

function App() {
  const [searchValue, setSearchValue] = useState("");
  const [twitterHandler, setTwitterHandler] = useState<GetEnsTextReturnType>();
  const [instagramHandler, setInstagramHandler] =
    useState<GetEnsTextReturnType>();
  const [verifications, setVerifications] = useState<GetEnsTextReturnType>();
  const [vpTokens, setVpTokens] = useState<
    Array<VerifiableCredentialPresentation>
  >([]);
  const [publicAddress, setPublicAddress] = useState("domico.eth");

  const getEnsText = useCallback(
    async (key: string) => {
      const resultEnsText = await publicClient.getEnsText({
        name: normalize(publicAddress),
        key,
      });
      return resultEnsText;
    },
    [publicAddress],
  );

  const ensCredential = useMemo(() => {
    return vpTokens.find((token) => token.type[0] === CredentialTemplate.ENS);
  }, [vpTokens]);

  const personHoodCredential = useMemo(() => {
    return vpTokens.find(
      (token) => token.type[0] === CredentialTemplate.Personhood,
    );
  }, [vpTokens]);

  const twitterCredential = useMemo(() => {
    return vpTokens.find(
      (token) =>
        token.type[0] === CredentialTemplate.X &&
        token.credentialSubject.username === twitterHandler,
    );
  }, [twitterHandler, vpTokens]);

  useEffect(() => {
    const searchInner = debounce(async () => {
      setTwitterHandler(undefined);
      setVerifications(undefined);
      setVpTokens([]);
      setPublicAddress(searchValue);
    }, 500);
    if (searchValue.trim()) searchInner();

    return () => {
      searchInner.clear();
    };
  }, [searchValue]);

  useEffect(() => {
    if (!publicAddress) return;

    (async () => {
      const resultTwitter = await getEnsText("com.twitter");
      setTwitterHandler(resultTwitter);
      const resultVerifications = await getEnsText("verifications");
      setVerifications(resultVerifications);
      let vpTokenUrl = "";
      try {
        vpTokenUrl = JSON.parse(resultVerifications || "")[0] as string;
      } catch {
        console.log(`ENS name haven't verified with Dentity`);
      }
      const res = await getVerificationPresentations(vpTokenUrl);
      if (!res || !res.data) {
        console.log("Get VP Token failed");
      }
      setVpTokens(res?.data.vp_token || []);
      const resultInstagram = await getEnsText("com.instagram");
      setInstagramHandler(resultInstagram);
    })();
  }, [getEnsText, publicAddress]);

  return (
    <>
      <h1>Dentity Verification</h1>
      <input
        type="text"
        value={searchValue}
        style={{ fontSize: 28, padding: "10px 20px", textAlign: "center" }}
        placeholder="Search for a name"
        onChange={(e) => {
          setSearchValue(e.target.value);
        }}
      />
      <h2>
        {publicAddress}{" "}
        {ensCredential && (
          <MdVerified size={24} style={{ marginLeft: "10px" }} color="green" />
        )}
      </h2>
      <div style={{ marginBottom: "10px" }}>
        <button>
          <FaXTwitter style={{ marginRight: "10px" }} />
          twitterHandler is {twitterHandler}
        </button>
        {twitterCredential && (
          <MdVerified size={24} style={{ marginLeft: "10px" }} color="green" />
        )}
      </div>
      <div>
        <button>
          <FaInstagram style={{ marginRight: "10px" }} />
          instagramHandler is {instagramHandler}
        </button>
      </div>
      <div className="card">
        verifications url is {JSON.parse((verifications as string) || "{}")[0]}
      </div>
      <p>
        ensCredential is {ensCredential ? "verified" : "not verified"}
        <a
          href={`https://etherscan.io/address/${ensCredential?.credentialSubject?.ethAddress}`}
          target="_blank"
          style={{ marginLeft: "10px" }}
        >
          Etherscan
        </a>
      </p>
      <p>
        personHoodCredential is{" "}
        {personHoodCredential ? "verified" : "not verified"}
      </p>
      <p>
        twitterCredential is {twitterCredential ? "verified" : "not verified"}
      </p>
    </>
  );
}

export default App;
