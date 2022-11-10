
import {useState, useEffect} from 'react';
import {AppBar, Container, CircularProgress, Divider, Paper,  Typography  } from '@mui/material';
import {ConnectAccount, HandlePubKey, Mint, RentNFT, ShowStatus, SetSecretPhrase, DepositAsset, SetOwnerConfirm, SetExpectedURI, SetUserConfirm, ShowHandshakeStatus, TransferNFT} from "./components"

function Layout(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(true)

  useEffect(() => {
    setSuccess(!loading)
  }, [loading])

  return (
    <div>
        <AppBar
        position="absolute"
        color="default"
        elevation={0}
        sx={{
          position: 'relative',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Typography variant="h6" color="inherit" noWrap>
          Ownership update demo
        </Typography>
      </AppBar>
      <Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
        <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
          <Typography align="center" gutterBottom>
            {
              success ? (
                "Install Metamask first and get GoerliETH from Goerli the testnet faucet"
              ) : (
                <CircularProgress />
              )
            }
            
          </Typography>
          <Divider />

          <ConnectAccount account={undefined}/>
          <Divider />
          
          <Mint setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <RentNFT setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <ShowStatus setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <HandlePubKey setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <SetSecretPhrase setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <DepositAsset setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <SetOwnerConfirm setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <SetExpectedURI setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <SetUserConfirm setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <ShowHandshakeStatus setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />

          <TransferNFT setLoading={setLoading} setSuccess={setSuccess} />
          <Divider />
          
      </Paper>
      </Container>
      <Divider />
    </div>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Layout />
      </header>
    </div>
  );
}

export default App;
