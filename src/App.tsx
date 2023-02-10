import { useState } from 'react';
import axios from 'axios';
import { NFTStorage } from "nft.storage";
function App() {
  const [prompt,setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState("")
  const [file, setFile] = useState<File | Blob>()
  const [loading,setLoading] = useState(false);
  const [mintingLoading,setMintingLoading] = useState(false);
  const [message,setMessage] = useState("");
  
  const generateArt = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}}`,
          },
          method: "POST",
          inputs: prompt,
        },
        { responseType: "blob" }
      );

      console.log(response);
      
      const file = new File([response.data], "image.png", {
        type: "image/png",
      });
      // saving the file in a state
      setFile(file);

      const url = URL.createObjectURL(response.data)
      // console.log(url)
      console.log(url)
      // Set state for image
      setImageBlob(url)
      setLoading(false);
    } catch (err) {
      setLoading(false)
      setMessage("THERE IS AN ISSUE WITH THE API... PLEASE TRY LATER!!")
      console.log(err);
    }
  };

  const uploadArtToIpfs = async () => {
    try {
  
      const nftstorage = new NFTStorage({
        token: `${process.env.REACT_APP_NFT_STORAGE}`,
      })
  
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file as Blob
      })
  
      console.log(store)
      return cleanupIPFS(store.data.image.href)
    } catch(err) {
      console.log(err)
    }
  }

  const cleanupIPFS = (url:string) => {
    if(url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  }
  
  const mintNft = async () => {
    try {
      setMintingLoading(true);
      const imageURL = await uploadArtToIpfs();
  
      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: "Sample NFT",
          description: "Build with NFTPort!",
          mint_to_address: `${process.env.METAMASK_WALLET}`,
        },
        {
          headers: {
            Authorization: process.env.REACT_APP_NFT_PORT,
          }
        }
      );
      const data = await response.data;
      console.log(data);
      setMintingLoading(false);
    } catch (err) {
      console.log(err);
    }
  };
  

  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-4'>
      <h1 className='text-4xl font-extrabold'>
        AI Art Gasless Mints
      </h1>
      <div className='flex items-center justify-center gap-4'>
        <input
          className='border-2 border-black rounded-md p-2'
          onChange={(e)=>{setPrompt(e.target.value)}}
          type="text"
          placeholder='enter a prompt'
        />
        <button onClick={generateArt} className='bg-black text-white rounded-md p-2'>
          Next
        </button>
      </div>
      {
        loading && <button type="button" className="bg-indigo-500 ..." disabled>
        <svg className="animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24">
        </svg>
        Loading...
      </button>
      }
      {
        message && 
        <h1 className='text-2xl'>
          {message}
        </h1>
      }
      {
        imageBlob && <div className="flex flex-col gap-4 items-center rounded justify-center">
        <img src={imageBlob} alt="AI generated art" />
        {
          mintingLoading && <button type="button" className="bg-indigo-500 ..." disabled>
          <svg className="animate-spin h-5 w-5 mr-3 ..." viewBox="0 0 24 24">
          </svg>
          NFT is minting...
        </button>
        }
        <button
          onClick={mintNft}
          className="bg-black text-white rounded-md p-2"
        >
          Mint NFT
        </button> 
      </div>      
      }
      
    </div>
  );
}

export default App;
